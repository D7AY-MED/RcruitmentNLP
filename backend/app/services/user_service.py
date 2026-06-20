from sqlalchemy.orm import Session
from app.models.user import User
from app.repositories.user_repository import (
    get_user,
    get_users,
    create_user,
    delete_user
)
from app.security import hash_password


def create_user_service(db: Session, data):

    user = User(
        name=data.name,
        email=data.email,
        password_hash=hash_password(data.password),
        role=data.role
    )

    return create_user(db, user)


def get_all_users_service(db: Session):
    return get_users(db)


def get_user_service(db: Session, user_id: int):
    return get_user(db, user_id)


def delete_user_service(db: Session, user_id: int):
    user = get_user(db, user_id)

    if user:
        delete_user(db, user)

    return user