import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.auth import get_current_recruiter, get_supabase, parse_datetime
from app.schemas import (
    RecruiterSupabaseRegister,
    RecruiterSupabaseLogin,
    RecruiterSupabaseOut,
    RecruiterSupabaseToken,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/recruiter", tags=["recruiter-supabase-auth"])

@router.post("/register", response_model=RecruiterSupabaseToken, status_code=status.HTTP_201_CREATED)
async def register(payload: RecruiterSupabaseRegister):
    client = get_supabase()
    
    # 1. Create the user in Supabase Auth via Admin API (pre-confirmed)
    try:
        created = client.auth.admin.create_user({
            "email": payload.email,
            "password": payload.password,
            "email_confirm": True,
            "user_metadata": {
                "full_name": payload.full_name,
                "company_name": payload.company_name,
                "phone": payload.phone,
            }
        })
    except Exception as e:
        msg = str(e)
        is_duplicate = "already" in msg or "exist" in msg
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT if is_duplicate else status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists." if is_duplicate else msg,
        )
        
    user_id = created.user.id
    
    # 2. Insert recruiter profile into hr_profiles
    try:
        profile_data = {
            "id": user_id,
            "full_name": payload.full_name,
            "email": payload.email,
            "company_name": payload.company_name,
            "phone": payload.phone,
        }
        client.table("hr_profiles").upsert(profile_data).execute()
    except Exception as e:
        # Rollback auth user
        try:
            client.auth.admin.delete_user(user_id)
        except Exception:
            pass
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Profile creation failed: {e}",
        )
        
    # 3. Log in user to return access token
    try:
        session = client.auth.sign_in_with_password({
            "email": payload.email,
            "password": payload.password
        })
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Account created, but sign-in failed. Please login. Details: {e}",
        )
        
    return RecruiterSupabaseToken(
        access_token=session.session.access_token,
        token_type="bearer",
        recruiter=RecruiterSupabaseOut(
            id=user_id,
            full_name=payload.full_name,
            email=payload.email,
            company_name=payload.company_name,
            phone=payload.phone,
            created_at=parse_datetime(getattr(created.user, "created_at", None))
        )
    )

@router.post("/login", response_model=RecruiterSupabaseToken)
async def login(payload: RecruiterSupabaseLogin):
    client = get_supabase()
    
    # 1. Sign in via Supabase Auth
    try:
        session = client.auth.sign_in_with_password({
            "email": payload.email,
            "password": payload.password
        })
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )
        
    user_id = session.user.id
    
    # 2. Retrieve recruiter profile
    result = client.table("hr_profiles").select("*").eq("id", user_id).limit(1).execute()
    if not result.data:
        # Fallback profile creation if auth user exists but profile row is missing
        meta = session.user.user_metadata or {}
        profile_data = {
            "id": user_id,
            "full_name": meta.get("full_name", ""),
            "email": session.user.email,
            "company_name": meta.get("company_name", ""),
            "phone": meta.get("phone", None),
        }
        client.table("hr_profiles").upsert(profile_data).execute()
        profile = profile_data
    else:
        profile = result.data[0]
        
    return RecruiterSupabaseToken(
        access_token=session.session.access_token,
        token_type="bearer",
        recruiter=RecruiterSupabaseOut(
            id=UUID(profile["id"]) if isinstance(profile["id"], str) else profile["id"],
            full_name=profile["full_name"],
            email=profile["email"],
            company_name=profile["company_name"],
            phone=profile.get("phone"),
            created_at=parse_datetime(getattr(session.user, "created_at", None))
        )
    )

@router.get("/me", response_model=RecruiterSupabaseOut)
async def me(current=Depends(get_current_recruiter)):
    return RecruiterSupabaseOut(
        id=UUID(current["id"]) if isinstance(current["id"], str) else current["id"],
        full_name=current["full_name"],
        email=current["email"],
        company_name=current["company_name"],
        phone=current.get("phone"),
        created_at=parse_datetime(current.get("created_at"))
    )
