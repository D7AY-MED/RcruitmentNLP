from sqlalchemy.orm import Session
from app.models.jobOffer import JobOffer


# CREATE
def create_job_offer(db: Session, data):

    offer = JobOffer(
        recruiter_id=data.recruiter_id,
        company_name=data.company_name,
        title=data.title,
        description=data.description,
        required_skills=data.required_skills,
        location=data.location,
        experience_level=data.experience_level,
        salary=data.salary
    )

    db.add(offer)
    db.commit()
    db.refresh(offer)

    return offer


# GET ALL
def get_all_offers(db: Session):
    return db.query(JobOffer).all()


# GET ONE
def get_offer(db: Session, offer_id: int):
    return db.query(JobOffer).filter(JobOffer.id == offer_id).first()


# UPDATE
def update_offer(db: Session, offer: JobOffer, data):

    for key, value in data.dict(exclude_unset=True).items():
        setattr(offer, key, value)

    db.commit()
    db.refresh(offer)

    return offer


# DELETE
def delete_offer(db: Session, offer: JobOffer):
    db.delete(offer)
    db.commit()