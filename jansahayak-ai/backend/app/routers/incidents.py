from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.complaint import Complaint
from app.models.department import Department
from app.models.incident import Incident, IncidentComplaint
from app.schemas.incident import IncidentCreate, IncidentReview

router = APIRouter(prefix="/api/incidents", tags=["Incidents"])


def serialize_incident(db: Session, incident: Incident) -> dict:
    complaints = []
    for association in incident.associations:
        complaint = db.query(Complaint).filter(Complaint.id == association.complaint_id).first()
        if complaint:
            complaints.append({
                "complaint_id": complaint.id,
                "reference_id": complaint.reference_id,
                "similarity_score": association.similarity_score,
                "matching_signals": association.matching_signals,
                "review_status": association.review_status,
                "officer_decision": association.officer_decision,
                "review_timestamp": association.review_timestamp,
            })
    return {
        "id": incident.id,
        "title": incident.title,
        "district": incident.district,
        "locality": incident.locality,
        "department_id": incident.department_id,
        "severity": incident.severity,
        "notes": incident.notes,
        "created_at": incident.created_at,
        "complaints": complaints,
    }


@router.post("", status_code=status.HTTP_201_CREATED)
def create_incident(payload: IncidentCreate, db: Session = Depends(get_db)):
    unique_ids = list(dict.fromkeys(payload.complaint_ids))
    complaints = db.query(Complaint).filter(Complaint.id.in_(unique_ids)).all()
    found = {complaint.id: complaint for complaint in complaints}
    missing = [complaint_id for complaint_id in unique_ids if complaint_id not in found]
    if missing:
        raise HTTPException(status_code=404, detail=f"Complaints not found: {missing}")

    if payload.department_id is not None:
        department = db.query(Department).filter(Department.id == payload.department_id).first()
        if department is None:
            raise HTTPException(status_code=404, detail="Department not found")

    try:
        incident = Incident(
            title=payload.title,
            district=payload.district,
            locality=payload.locality,
            department_id=payload.department_id,
            severity=payload.severity,
            notes=payload.notes,
        )
        db.add(incident)
        db.flush()

        for complaint_id in unique_ids:
            complaint = found[complaint_id]
            db.add(IncidentComplaint(
                incident_id=incident.id,
                complaint_id=complaint_id,
                similarity_score=1.0 if len(unique_ids) > 1 else 0.0,
                matching_signals={
                    "same_district": bool(payload.district and complaint.district.lower() == payload.district.lower()),
                    "same_locality": bool(payload.locality and complaint.locality.lower() == payload.locality.lower()),
                    "source": "Officer-created incident",
                },
                review_status="Proposed",
            ))
        db.commit()
        db.refresh(incident)
        return serialize_incident(db, incident)
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database error while creating incident") from exc


@router.get("")
def list_incidents(db: Session = Depends(get_db)):
    try:
        incidents = db.query(Incident).order_by(Incident.created_at.desc(), Incident.id.desc()).all()
        return [serialize_incident(db, incident) for incident in incidents]
    except SQLAlchemyError as exc:
        raise HTTPException(status_code=500, detail="Database error while listing incidents") from exc


@router.post("/{incident_id}/review")
def review_incident_relationship(incident_id: int, payload: IncidentReview, db: Session = Depends(get_db)):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if incident is None:
        raise HTTPException(status_code=404, detail="Incident not found")

    association = db.query(IncidentComplaint).filter(
        IncidentComplaint.incident_id == incident_id,
        IncidentComplaint.complaint_id == payload.complaint_id,
    ).first()
    if association is None:
        raise HTTPException(status_code=404, detail="Complaint is not associated with this incident")

    normalized = "Confirmed" if payload.decision == "confirm" else "Rejected"
    association.review_status = normalized
    association.officer_decision = normalized
    association.review_timestamp = datetime.now(timezone.utc)
    if payload.officer_decision_reason:
        association.matching_signals = {
            **(association.matching_signals or {}),
            "officer_decision_reason": payload.officer_decision_reason,
        }

    try:
        db.commit()
        db.refresh(incident)
        return serialize_incident(db, incident)
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database error while reviewing incident relationship") from exc
