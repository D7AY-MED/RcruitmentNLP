import logging
import os
import json
import time
import re
from uuid import UUID
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from google import genai
from google.genai import types
from openai import AsyncOpenAI

from app.auth import get_supabase, get_current_recruiter
from app.interview.openai_client import OPENAI_MODEL

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/matchier", tags=["matchier"])

# Request/Response Schemas
class SearchRequest(BaseModel):
    pool_id: str
    query: str

class CandidateMatch(BaseModel):
    id: str
    name: str
    summary: str
    matchDescription: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    cv_url: Optional[str] = None

class SearchResponse(BaseModel):
    searchId: str
    candidates: List[CandidateMatch]

# Helper to extract UUIDs
def extract_uuid(text: str) -> Optional[str]:
    match = re.search(r'([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})', text, re.IGNORECASE)
    if match:
        return match.group(1)
    return None

@router.post("/search", response_model=SearchResponse)
async def search_candidates(req: SearchRequest, recruiter=Depends(get_current_recruiter)):
    pool_id = req.pool_id
    query = req.query.strip()
    hr_id = recruiter["id"]
    
    if not query:
        raise HTTPException(status_code=400, detail="Search query cannot be empty")
        
    db = get_supabase()
    
    # 1. Fetch the job pool and verify ownership
    pool_res = db.table("job_pools").select("*").eq("id", pool_id).eq("hr_id", hr_id).limit(1).execute()
    if not pool_res.data:
        raise HTTPException(status_code=404, detail="Job pool not found or access denied")
    
    pool = pool_res.data[0]
    gemini_store_name = pool.get("gemini_store_name")
    
    if not gemini_store_name:
        raise HTTPException(
            status_code=400, 
            detail="This job pool does not have a linked AI Vector Store. Please verify candidate uploads."
        )

    # 2. Layer 1: Gemini File Search
    google_api_key = os.environ.get("GOOGLE_API_KEY")
    if not google_api_key:
        raise HTTPException(status_code=500, detail="GOOGLE_API_KEY is not set in backend environment")
        
    logger.info("Starting Gemini Vector Search on store: %s", gemini_store_name)
    try:
        client = genai.Client(api_key=google_api_key)
        
        # Robust connection retry / validation
        store_res = None
        try:
            # We first try to check if we can access the store directly
            # Gemini file search accepts the store name (e.g. stores/1234)
            store_res = client.file_search_stores.get(name=gemini_store_name)
        except Exception as store_err:
            logger.warning("Direct store fetch failed: %s. Listing stores to find display name match...", store_err)
            # Fallback: list stores to find matching store
            stores = list(client.file_search_stores.list())
            store_res = next((s for s in stores if s.name == gemini_store_name or s.display_name == gemini_store_name), None)
            
        if not store_res:
            raise RuntimeError(f"Gemini File Search Store '{gemini_store_name}' could not be located.")

        prompt = f"""
        Find the top 15 documents/files in the store that best match this query: "{query}"
        
        Please list them in order of relevance.
        For each match, simply provide the Filename or Document Title.
        """
        
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                tools=[
                    types.Tool(
                        file_search=types.FileSearch(
                            file_search_store_names=[store_res.name],
                            top_k=20
                        )
                    )
                ]
            )
        )
    except Exception as e:
        logger.error("Gemini File Search failed: %s", e)
        raise HTTPException(status_code=502, detail=f"Gemini Vector Search failed: {str(e)}")

    # Extract candidate UUIDs
    candidate_uuids = []
    seen_uuids = set()
    
    # Extract from grounding chunks
    if response.candidates and response.candidates[0].grounding_metadata:
        md = response.candidates[0].grounding_metadata
        if hasattr(md, 'grounding_chunks'):
            for chunk in md.grounding_chunks:
                if hasattr(chunk, 'retrieved_context'):
                    title = chunk.retrieved_context.title
                    if title:
                        uuid = extract_uuid(title)
                        if uuid and uuid not in seen_uuids:
                            candidate_uuids.append(uuid)
                            seen_uuids.add(uuid)
                            
    # Fallback to response text
    if hasattr(response, 'text') and response.text:
        text_lines = response.text.split('\n')
        for line in text_lines:
            uuid = extract_uuid(line)
            if uuid and uuid not in seen_uuids:
                candidate_uuids.append(uuid)
                seen_uuids.add(uuid)
                
    logger.info("Found %d candidate UUIDs from Gemini File Search", len(candidate_uuids))
    
    if not candidate_uuids:
        # Save empty search result to history
        search_id = f"search-{int(time.time())}"
        try:
            db.table("hr_searches").insert({
                "hr_id": hr_id,
                "pool_id": pool_id,
                "query": query,
                "candidates": []
            }).execute()
        except Exception as db_err:
            logger.error("Failed to save empty search history to DB: %s", db_err)
        return SearchResponse(searchId=search_id, candidates=[])

    # 3. Retrieve Candidate summaries & profiles
    # We query the Candidate_summaries table for the UUIDs, and select candidate_profiles relation
    sum_res = db.table("Candidate_summaries").select("*, candidate_profiles(*)").in_("candidate_id", candidate_uuids).execute()
    
    if not sum_res.data:
        # Fallback: Save empty search result to history if profiles are missing
        search_id = f"search-{int(time.time())}"
        try:
            db.table("hr_searches").insert({
                "hr_id": hr_id,
                "pool_id": pool_id,
                "query": query,
                "candidates": []
            }).execute()
        except Exception as db_err:
            logger.error("Failed to save empty search history to DB: %s", db_err)
        return SearchResponse(searchId=search_id, candidates=[])
        
    candidates_by_id = {}
    candidates_for_openai = []
    
    for row in sum_res.data:
        cand_id = row["candidate_id"]
        profile = row.get("candidate_profiles") or {}
        
        cand_match = CandidateMatch(
            id=cand_id,
            name=profile.get("full_name") or row.get("Candidate_name") or "Unknown Candidate",
            summary=row.get("summary") or "Summary not available.",
            phone=profile.get("phone") or row.get("phone") or "Not available",
            email=profile.get("email") or "Not available",
            cv_url=profile.get("cv_url") or "#"
        )
        candidates_by_id[cand_id] = cand_match
        candidates_for_openai.append({
            "id": cand_id,
            "name": cand_match.name,
            "summary": cand_match.summary
        })

    # 4. Layer 2: OpenAI Reranking & Justification
    openai_api_key = os.environ.get("OPENAI_API_KEY")
    if not openai_api_key:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY is not set in backend environment")
        
    logger.info("Sending %d candidates to OpenAI for reranking and justifications...", len(candidates_for_openai))
    try:
        openai_client = AsyncOpenAI(api_key=openai_api_key)
        
        openai_prompt = f"""
        You are an expert HR assistant scoring and ranking candidates for a job position.
        
        Job Pool Details:
        - Title: {pool.get('title')}
        - Description: {pool.get('description') or ''}
        - Mission: {pool.get('main_mission') or ''}
        - Must-Have Skills: {', '.join(pool.get('must_have_skills') or [])}
        
        Recruiter Search Query:
        "{query}"
        
        We have retrieved the following candidate summaries:
        {json.dumps(candidates_for_openai, indent=2)}
        
        Please evaluate these candidates based on how well they match the job pool requirements and the search query.
        1. Select the top 5 candidates.
        2. Rank them in order of relevance (best fit first).
        3. For each of the top 5 candidates, write a professional, concise justification (1-3 sentences) explaining why they are a top match.
        4. Return the result in a raw JSON object with a single key "results" which is an array of candidate objects, each containing:
           - "candidate_id" (string matching the candidate's ID)
           - "justification" (string explaining why they match)
           
        You MUST output ONLY raw JSON. Do not include markdown code blocks or backticks.
        """
        
        completion = await openai_client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {"role": "system", "content": "You are a professional HR intelligence assistant. Return ONLY valid JSON."},
                {"role": "user", "content": openai_prompt}
            ],
            response_format={"type": "json_object"}
        )
        
        response_text = completion.choices[0].message.content
        openai_data = json.loads(response_text)
        openai_results = openai_data.get("results", [])
    except Exception as e:
        logger.error("OpenAI Reranking failed: %s", e)
        # Fallback: Just return the candidates as ranked by Gemini, without justifications
        openai_results = [{"candidate_id": cid, "justification": "Matched via Gemini Vector search."} for cid in candidate_uuids[:5]]

    # Build the final ranked list
    final_candidates = []
    for rank_item in openai_results:
        cid = rank_item.get("candidate_id")
        if cid in candidates_by_id:
            cand = candidates_by_id[cid]
            # Attach the justification from OpenAI
            cand.matchDescription = rank_item.get("justification") or "Top match based on qualifications."
            final_candidates.append(cand)

    # If OpenAI failed to return matches or some are filtered, ensure we return something if candidates exist
    if not final_candidates and candidates_by_id:
        for cid, cand in list(candidates_by_id.items())[:5]:
            cand.matchDescription = "Matched via Gemini Vector search."
            final_candidates.append(cand)

    # 5. Save search results to DB (hr_searches table)
    # Serialize candidates to list of dicts for JSONB
    candidates_dict_list = [c.model_dump() for c in final_candidates]
    search_id_db = None
    try:
        save_res = db.table("hr_searches").insert({
            "hr_id": hr_id,
            "pool_id": pool_id,
            "query": query,
            "candidates": candidates_dict_list
        }).execute()
        if save_res.data:
            search_id_db = str(save_res.data[0]["id"])
    except Exception as db_err:
        logger.error("Failed to save search history to database: %s", db_err)

    search_id = search_id_db or f"search-{int(time.time())}"
    return SearchResponse(searchId=search_id, candidates=final_candidates)

@router.get("/history", response_model=List[dict])
async def get_search_history(recruiter=Depends(get_current_recruiter)):
    hr_id = recruiter["id"]
    db = get_supabase()
    
    try:
        # Join with job_pools to show the pool title
        res = db.table("hr_searches").select("*, job_pools(title)").eq("hr_id", hr_id).order("created_at", desc=True).execute()
        
        out = []
        for row in (res.data or []):
            pool = row.get("job_pools") or {}
            candidates_list = row.get("candidates") or []
            
            out.append({
                "id": str(row["id"]),
                "queryDescription": row["query"],
                "createdAt": row["created_at"],
                "topCount": len(candidates_list),
                "unlockedCount": len(candidates_list), # since unlock is removed, all are unlocked
                "pool_id": str(row["pool_id"]),
                "pool_title": pool.get("title") or "Unknown Pool"
            })
        return out
    except Exception as e:
        logger.error("Failed to fetch search history: %s", e)
        return []

@router.get("/history/{search_id}", response_model=SearchResponse)
async def get_search_details(search_id: UUID, recruiter=Depends(get_current_recruiter)):
    hr_id = recruiter["id"]
    db = get_supabase()
    
    res = db.table("hr_searches").select("*").eq("id", str(search_id)).eq("hr_id", hr_id).limit(1).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Search details not found")
        
    row = res.data[0]
    candidates_list = row.get("candidates") or []
    
    # Parse back into Pydantic models
    candidates = []
    for c in candidates_list:
        candidates.append(CandidateMatch(
            id=c.get("id"),
            name=c.get("name"),
            summary=c.get("summary"),
            matchDescription=c.get("matchDescription"),
            phone=c.get("phone"),
            email=c.get("email"),
            cv_url=c.get("cv_url")
        ))
        
    return SearchResponse(searchId=str(row["id"]), candidates=candidates)
