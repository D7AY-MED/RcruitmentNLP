from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.schemas.user import UserCreate, UserResponse
from app.services.user_service import (
    create_user_service,
    get_all_users_service,
    get_user_service,
    delete_user_service
)
from app.database import get_db

router = APIRouter(prefix="/users", tags=["Users"])


# CREATE USER
@router.post("/", response_model=UserResponse)
def create_user(data: UserCreate, db: Session = Depends(get_db)):
    return create_user_service(db, data)


# GET ALL USERS
@router.get("/", response_model=list[UserResponse])
def get_users(db: Session = Depends(get_db)):
    return get_all_users_service(db)


# GET USER BY ID
@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = get_user_service(db, user_id)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user


# DELETE USER
@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = delete_user_service(db, user_id)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {"message": "User deleted successfully"}