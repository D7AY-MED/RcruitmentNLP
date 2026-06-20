from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.job_offer import JobOfferCreate, JobOfferUpdate, JobOfferResponse
from app.services.job_offer_service import (
    create_job_offer,
    get_all_offers,
    get_offer,
    update_offer,
    delete_offer
)

router = APIRouter(prefix="/jobs", tags=["Job Offers"])


# CREATE OFFER
@router.post("/", response_model=JobOfferResponse)
def create_offer(data: JobOfferCreate, db: Session = Depends(get_db)):
    return create_job_offer(db, data)


# GET ALL
@router.get("/", response_model=list[JobOfferResponse])
def list_offers(db: Session = Depends(get_db)):
    return get_all_offers(db)


# GET BY ID
@router.get("/{offer_id}", response_model=JobOfferResponse)
def get_one(offer_id: int, db: Session = Depends(get_db)):

    offer = get_offer(db, offer_id)

    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")

    return offer


# UPDATE
@router.put("/{offer_id}", response_model=JobOfferResponse)
def update(offer_id: int, data: JobOfferUpdate, db: Session = Depends(get_db)):

    offer = get_offer(db, offer_id)

    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")

    return update_offer(db, offer, data)


# DELETE
@router.delete("/{offer_id}")
def delete(offer_id: int, db: Session = Depends(get_db)):

    offer = get_offer(db, offer_id)

    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")

    delete_offer(db, offer)

    return {"message": "Offer deleted successfully"}
