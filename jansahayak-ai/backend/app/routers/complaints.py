from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.complaint import Complaint
from app.models.status_history import StatusHistory
from app.schemas.complaint import ComplaintCreate, ComplaintResponse, ComplaintUpdate

router = APIRouter(prefix="/api/complaints", tags=["Complaints"])

ALLOWED_STATUSES = {"Submitted", "Under Review", "In Progress", "Resolved", "Closed", "Rejected"}


def generate_reference_id(db: Session) -> str:
    import uuid

    while True:
        reference_id = f"JS-{uuid.uuid4().hex[:8].upper()}"
        if db.query(Complaint).filter(Complaint.reference_id == reference_id).first() is None:
            return reference_id


@router.post("", response_model=ComplaintResponse, status_code=status.HTTP_201_CREATED)
def create_complaint(payload: ComplaintCreate, db: Session = Depends(get_db)):
    if payload.department_id is not None:
        from app.models.department import Department

        department = db.query(Department).filter(Department.id == payload.department_id).first()
        if department is None:
            raise HTTPException(status_code=404, detail="Department not found")

    complaint = Complaint(
        reference_id=generate_reference_id(db),
        title=payload.title.strip(),
        description=payload.description.strip(),
        language=payload.language.strip(),
        district=payload.district.strip(),
        locality=payload.locality.strip(),
        category=payload.category.strip(),
        priority=payload.priority.strip(),
        department_id=payload.department_id,
    )

    db.add(complaint)
    db.flush()
    db.add(StatusHistory(complaint_id=complaint.id, status=complaint.status))
    db.commit()
    db.refresh(complaint)
    return complaint


@router.get("", response_model=list[ComplaintResponse])
def list_complaints(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    return db.query(Complaint).order_by(Complaint.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/{reference_id}", response_model=ComplaintResponse)
def get_complaint(reference_id: str, db: Session = Depends(get_db)):
    complaint = db.query(Complaint).filter(Complaint.reference_id == reference_id.upper()).first()
    if complaint is None:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return complaint


@router.patch("/{complaint_id}/status", response_model=ComplaintResponse)
def update_complaint_status(
    complaint_id: int,
    payload: ComplaintUpdate,
    db: Session = Depends(get_db),
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if complaint is None:
        raise HTTPException(status_code=404, detail="Complaint not found")

    new_status = payload.status.strip().title()
    if new_status not in ALLOWED_STATUSES:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid status. Allowed statuses: {', '.join(sorted(ALLOWED_STATUSES))}",
        )

    complaint.status = new_status
    db.add(StatusHistory(complaint_id=complaint.id, status=new_status))
    db.commit()
    db.refresh(complaint)
    return complaint
