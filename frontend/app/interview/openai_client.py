import logging
import os
import json
from typing import AsyncGenerator

from openai import AsyncOpenAI

logger = logging.getLogger(__name__)

OPENAI_MODEL = os.environ.get("OPENAI_INTERVIEW_MODEL", "gpt-4.1-mini")


def _get_client() -> AsyncOpenAI:
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is not set.")
    return AsyncOpenAI(api_key=api_key)


def _extract_question(response) -> str:
    text = getattr(response, "output_text", None)
    if text and text.strip():
        return text.strip()

    for item in response.output or []:
        if item.type != "message":
            continue
        for content in item.content:
            if getattr(content, "type", None) == "output_text":
                t = getattr(content, "text", "")
                if t and t.strip():
                    return t.strip()

    raise RuntimeError("No question returned by model.")


async def start_interview(system_prompt: str) -> tuple[str, str]:
    client = _get_client()
    response = await client.responses.create(
        model=OPENAI_MODEL,
        store=True,
        input=[
            {"role": "system", "content": system_prompt},
            {
                "role": "user",
                "content": "Start the interview now by asking the first personalized question.",
            },
        ],
    )
    question = _extract_question(response)
    return response.id, question


async def continue_interview(
    previous_response_id: str, candidate_answer: str
) -> tuple[str, str]:
    client = _get_client()
    response = await client.responses.create(
        model=OPENAI_MODEL,
        store=True,
        previous_response_id=previous_response_id,
        input=candidate_answer,
    )
    question = _extract_question(response)
    return response.id, question


async def start_interview_stream(
    system_prompt: str,
) -> AsyncGenerator[tuple[str, str | dict], None]:
    client = _get_client()
    stream = await client.responses.create(
        model=OPENAI_MODEL,
        store=True,
        stream=True,
        input=[
            {"role": "system", "content": system_prompt},
            {
                "role": "user",
                "content": "Start the interview now by asking the first personalized question.",
            },
        ],
    )

    response_id = ""
    question = ""

    async for event in stream:
        event_type = getattr(event, "type", "")

        response_data = getattr(event, "response", None)
        if not response_id and response_data and getattr(response_data, "id", None):
            response_id = response_data.id

        if event_type == "response.output_text.delta":
            delta = getattr(event, "delta", "")
            if delta:
                question += delta
                yield ("delta", {"delta": delta})

        if event_type == "response.completed":
            if response_data:
                text = getattr(response_data, "output_text", "") or ""
                if text and text.strip():
                    question = text.strip()
            if not response_id or not question.strip():
                raise RuntimeError("Streaming completed without question payload.")
            yield ("done", {"responseId": response_id, "question": question.strip()})
            return

    raise RuntimeError("OpenAI stream ended before completion.")


async def continue_interview_stream(
    previous_response_id: str, candidate_answer: str
) -> AsyncGenerator[tuple[str, str | dict], None]:
    client = _get_client()
    stream = await client.responses.create(
        model=OPENAI_MODEL,
        store=True,
        stream=True,
        previous_response_id=previous_response_id,
        input=candidate_answer.strip(),
    )

    response_id = ""
    question = ""

    async for event in stream:
        event_type = getattr(event, "type", "")

        response_data = getattr(event, "response", None)
        if not response_id and response_data and getattr(response_data, "id", None):
            response_id = response_data.id

        if event_type == "response.output_text.delta":
            delta = getattr(event, "delta", "")
            if delta:
                question += delta
                yield ("delta", {"delta": delta})

        if event_type == "response.completed":
            if response_data:
                text = getattr(response_data, "output_text", "") or ""
                if text and text.strip():
                    question = text.strip()
            if not response_id or not question.strip():
                raise RuntimeError("Streaming completed without question payload.")
            yield ("done", {"responseId": response_id, "question": question.strip()})
            return

    raise RuntimeError("OpenAI stream ended before completion.")


async def generate_summary(previous_response_id: str) -> str:
    client = _get_client()
    response = await client.responses.create(
        model=OPENAI_MODEL,
        store=True,
        previous_response_id=previous_response_id,
        input=(
            "Generate a concise, fact-based summary of the candidate's profile, combining details from both their CV "
            "and their interview answers. Focus strictly on key matching criteria (such as core skills, years of experience, "
            "main achievements, mobility, availability, and specific project experience). Do not include any commentary, "
            "evaluation, or extra conversational text (no overtalking). Output the summary as clean bullet points."
        ),
    )
    return _extract_question(response)


async def generate_summary_and_score(previous_response_id: str, job_details: str) -> tuple[str, str]:
    client = _get_client()
    prompt = (
        f"Compare the candidate's CV and interview answers against the following job offer requirements:\n"
        f"[JOB OFFER REQUIREMENTS]\n{job_details}\n\n"
        f"Generate the following two items:\n"
        f"1. A concise, comparative, fact-based summary of the candidate's profile, showing how their skills, years of experience, achievements, availability, and language proficiencies align with the job requirements. Highlight the candidate's core strengths and matching advantages (their 'power') relative to the offer, as well as any notable gaps. Do not include meta-commentary. Output the summary as clean bullet points.\n"
        f"2. A highly precise, granular matching score from 0.00 to 100.00 representing how well the candidate matches the job requirements. "
        f"This score must reflect the exact alignment with the job offer. For instance, if the candidate has strong overall skills but lacks critical must-haves (like required languages, must-have skills, required years of experience, or violates any deal-breakers) mentioned in the offer, the score must be penalized severely and be low. "
        f"Be extremely rigorous, selective, and realistic: always output the score with exactly two decimal places (e.g., 85.34, 42.15, 61.80). Distinguish minor details to ensure unique, non-overlapping scores so candidates can be ranked accurately.\n\n"
        f"You MUST output the result as a raw JSON object with exactly two keys: 'summary' (string) and 'score' (float or string representing the float). Do not add any backticks or markdown code wrappers."
    )
    response = await client.responses.create(
        model=OPENAI_MODEL,
        store=True,
        previous_response_id=previous_response_id,
        input=prompt,
    )
    output_text = _extract_question(response)
    
    try:
        clean_text = output_text.strip()
        if clean_text.startswith("```"):
            lines = clean_text.splitlines()
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines[-1].startswith("```"):
                lines = lines[:-1]
            clean_text = "\n".join(lines).strip()
            
        data = json.loads(clean_text)
        summary = data.get("summary", "").strip()
        try:
            score_val = float(data.get("score", 0.0))
            score = f"{score_val:.2f}"
        except Exception:
            score = "0.00"
        return summary, score
    except Exception as e:
        logger.error("Failed to parse summary and score JSON: %s. Raw output: %s", e, output_text)
        return output_text, "0.00"
