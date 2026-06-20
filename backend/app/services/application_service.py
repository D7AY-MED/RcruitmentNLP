from sqlalchemy.orm import Session
from app.models.application import Application


# CREATE APPLICATION
def create_application(db: Session, data):

    application = Application(
        candidate_id=data.candidate_id,
        offer_id=data.offer_id,
        status="PENDING",
        matching_score=0
    )

    db.add(application)
    db.commit()
    db.refresh(application)

    return application


# GET ALL
def get_applications(db: Session):
    return db.query(Application).all()


# GET BY ID
def get_application(db: Session, app_id: int):
    return db.query(Application).filter(Application.id == app_id).first()


# UPDATE
def update_application(db: Session, app: Application, data):

    for key, value in data.dict(exclude_unset=True).items():
        setattr(app, key, value)

    db.commit()
    db.refresh(app)

    return app


# DELETE
def delete_application(db: Session, app: Application):
    db.delete(app)
    db.commit()