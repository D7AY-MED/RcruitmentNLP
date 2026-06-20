from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.application import (
    ApplicationCreate,
    ApplicationUpdate,
    ApplicationResponse
)
from app.services.application_service import (
    create_application,
    get_applications,
    get_application,
    update_application,
    delete_application
)

router = APIRouter(prefix="/applications", tags=["Applications"])


# CREATE APPLICATION (POSTULER)
@router.post("/", response_model=ApplicationResponse)
def create_app(data: ApplicationCreate, db: Session = Depends(get_db)):
    return create_application(db, data)


# GET ALL
@router.get("/", response_model=list[ApplicationResponse])
def list_apps(db: Session = Depends(get_db)):
    return get_applications(db)


# GET ONE
@router.get("/{app_id}", response_model=ApplicationResponse)
def get_one(app_id: int, db: Session = Depends(get_db)):

    app = get_application(db, app_id)

    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    return app


# UPDATE (status / score / interview link)
@router.put("/{app_id}", response_model=ApplicationResponse)
def update(app_id: int, data: ApplicationUpdate, db: Session = Depends(get_db)):

    app = get_application(db, app_id)

    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    return update_application(db, app, data)


# DELETE
@router.delete("/{app_id}")
def delete(app_id: int, db: Session = Depends(get_db)):

    app = get_application(db, app_id)

    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    delete_application(db, app)

    return {"message": "Application deleted successfully"}