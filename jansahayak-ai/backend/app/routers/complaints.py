import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, func
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.ai_assessment import AIAssessment
from app.models.complaint import Complaint
from app.models.department import Department
from app.models.status_history import StatusHistory
from app.schemas.complaint import ComplaintCreate, ComplaintResponse, ComplaintUpdate, OfficerTriageOverride
from app.services.ai_engine import AIEngine
from app.services.similarity_service import find_similar

router = APIRouter(prefix="/api/complaints", tags=["Complaints"])

ALLOWED_STATUSES = {"Submitted", "Under Review", "In Progress", "Resolved", "Closed", "Rejected"}


def generate_reference_id(db: Session, max_attempts: int = 20) -> str:
    for _ in range(max_attempts):
        reference_id = f"JS-{uuid.uuid4().hex[:8].upper()}"
        exists = db.query(Complaint.id).filter(Complaint.reference_id == reference_id).first()
        if exists is None:
            return reference_id
    raise HTTPException(status_code=503, detail="Unable to generate a unique complaint reference ID")


@router.post("", response_model=ComplaintResponse, status_code=status.HTTP_201_CREATED)
def create_complaint(payload: ComplaintCreate, db: Session = Depends(get_db)):
    if payload.department_id is not None:
        department = db.query(Department).filter(Department.id == payload.department_id).first()
        if department is None:
            raise HTTPException(status_code=404, detail="Department not found")

    complaint = Complaint(
        reference_id=generate_reference_id(db),
        title=payload.title,
        description=payload.description,
        language=payload.language,
        district=payload.district,
        locality=payload.locality,
        category=payload.category,
        priority=payload.priority,
        department_id=payload.department_id,
        status="Submitted",
    )

    try:
        db.add(complaint)
        db.flush()
        db.add(StatusHistory(complaint_id=complaint.id, status="Submitted", remarks="Complaint registered"))

        understanding = AIEngine().analyze(
            complaint.title,
            complaint.description,
            district=complaint.district,
            locality=complaint.locality,
        )
        db.add(AIAssessment(
            complaint_id=complaint.id,
            predicted_category=understanding["predicted_category"],
            summary=understanding["summary"],
            language=understanding["language"],
            issue_entities=understanding["issue_entities"],
            urgency_indicators=understanding["urgency_indicators"],
            evidence=understanding["evidence"],
            explanation=understanding["explanation"],
            model_or_method=understanding["model_or_method"],
            confidence=understanding["confidence"],
            recommended_department=understanding["recommended_department"],
            department_reason=understanding["department_reason"],
            department_evidence=understanding["department_evidence"],
            department_rule=understanding["department_rule"],
            recommended_priority=understanding["recommended_priority"],
            priority_reason=understanding["priority_rationale"],
            priority_evidence=understanding["priority_evidence"],
            priority_rules=understanding["priority_rules"],
        ))

        db.commit()
        db.refresh(complaint)
        return complaint
    except IntegrityError as exc:
        db.rollback()
        if "reference_id" in str(exc.orig).lower():
            raise HTTPException(status_code=409, detail="Reference ID collision; please retry") from exc
        raise HTTPException(status_code=409, detail="Complaint conflicts with existing data") from exc
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database error while registering complaint") from exc


@router.get("", response_model=list[ComplaintResponse])
def list_complaints(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    search: str | None = Query(default=None, max_length=30, description="Search by reference ID"),
    category: str | None = Query(default=None, max_length=100),
    department_id: int | None = Query(default=None, gt=0),
    priority: str | None = Query(default=None, max_length=20),
    complaint_status: str | None = Query(default=None, alias="status", max_length=30),
    locality: str | None = Query(default=None, max_length=200),
    db: Session = Depends(get_db),
):
    query = db.query(Complaint)

    if search:
        query = query.filter(func.upper(Complaint.reference_id).contains(search.strip().upper()))
    if category:
        query = query.filter(func.lower(Complaint.category).contains(category.strip().lower()))
    if department_id is not None:
        query = query.filter(Complaint.department_id == department_id)
    if priority:
        normalized_priority = priority.strip().title()
        if normalized_priority not in {"Low", "Medium", "High", "Critical"}:
            raise HTTPException(status_code=422, detail="Invalid priority filter")
        query = query.filter(Complaint.priority == normalized_priority)
    if complaint_status:
        normalized_status = complaint_status.strip().title()
        if normalized_status not in ALLOWED_STATUSES:
            raise HTTPException(status_code=422, detail="Invalid status filter")
        query = query.filter(Complaint.status == normalized_status)
    if locality:
        query = query.filter(func.lower(Complaint.locality).contains(locality.strip().lower()))

    try:
        return query.order_by(Complaint.created_at.desc(), Complaint.id.desc()).offset(skip).limit(limit).all()
    except SQLAlchemyError as exc:
        raise HTTPException(status_code=500, detail="Database error while listing complaints") from exc


@router.get("/{reference_id}", response_model=ComplaintResponse)
def get_complaint(reference_id: str, db: Session = Depends(get_db)):
    complaint = db.query(Complaint).filter(Complaint.reference_id == reference_id.strip().upper()).first()
    if complaint is None:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return complaint


@router.get("/{complaint_id}/related")
def get_related_complaints(complaint_id: int, db: Session = Depends(get_db)):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if complaint is None:
        raise HTTPException(status_code=404, detail="Complaint not found")

    candidates = [{
        "id": item.id,
        "reference_id": item.reference_id,
        "title": item.title,
        "description": item.description,
        "district": item.district,
        "locality": item.locality,
        "category": item.category,
        "created_at": item.created_at,
    } for item in db.query(Complaint).filter(Complaint.id != complaint.id).all()]

    matches = find_similar(
        " ".join((complaint.title, complaint.description)),
        candidates=candidates,
        district=complaint.district,
        locality=complaint.locality,
        category=complaint.category,
        submitted_at=complaint.created_at,
    )
    return {
        "complaint_id": complaint.id,
        "reference_id": complaint.reference_id,
        "potential_matches": matches,
        "disclaimer": "These are proposed relationships only. Officer confirmation is required; no complaints are merged.",
    }


@router.patch("/{complaint_id}/status", response_model=ComplaintResponse)
def update_complaint_status(
    complaint_id: int,
    payload: ComplaintUpdate,
    db: Session = Depends(get_db),
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if complaint is None:
        raise HTTPException(status_code=404, detail="Complaint not found")

    new_status = payload.status
    if complaint.status == new_status:
        raise HTTPException(status_code=409, detail=f"Complaint is already {new_status}")

    try:
        complaint.status = new_status
        db.add(StatusHistory(
            complaint_id=complaint.id,
            status=new_status,
            remarks=payload.remarks,
        ))
        db.commit()
        db.refresh(complaint)
        return complaint
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database error while updating complaint status") from exc


@router.get("/{reference_id}/ai-analysis")
def get_complaint_ai_analysis(reference_id: str, db: Session = Depends(get_db)):
    complaint = db.query(Complaint).filter(Complaint.reference_id == reference_id.strip().upper()).first()
    if complaint is None:
        raise HTTPException(status_code=404, detail="Complaint not found")

    analysis = AIEngine().analyze(
        complaint.title,
        complaint.description,
        district=complaint.district,
        locality=complaint.locality,
    )

    assessment = complaint.ai_assessment
    if assessment is None:
        assessment = AIAssessment(
            complaint_id=complaint.id,
            predicted_category=analysis["predicted_category"],
            summary=analysis["summary"],
            language=analysis["language"],
            issue_entities=analysis["issue_entities"],
            urgency_indicators=analysis["urgency_indicators"],
            evidence=analysis["evidence"],
            explanation=analysis["explanation"],
            model_or_method=analysis["model_or_method"],
            confidence=analysis["confidence"],
            recommended_department=analysis["recommended_department"],
            department_reason=analysis["department_reason"],
            department_evidence=analysis["department_evidence"],
            department_rule=analysis["department_rule"],
            recommended_priority=analysis["recommended_priority"],
            priority_reason=analysis["priority_rationale"],
            priority_evidence=analysis["priority_evidence"],
            priority_rules=analysis["priority_rules"],
        )
        try:
            db.add(assessment)
            db.commit()
            db.refresh(assessment)
        except SQLAlchemyError as exc:
            db.rollback()
            raise HTTPException(status_code=500, detail="Database error while storing complaint AI assessment") from exc

    candidates = [
        {
            "id": item.id,
            "reference_id": item.reference_id,
            "title": item.title,
            "description": item.description,
            "district": item.district,
            "locality": item.locality,
            "category": item.category,
            "created_at": item.created_at,
        }
        for item in db.query(Complaint).filter(Complaint.id != complaint.id).all()
    ]
    similar = find_similar(
        " ".join((complaint.title, complaint.description)),
        candidates=candidates,
        district=complaint.district,
        locality=complaint.locality,
        category=complaint.category,
        submitted_at=complaint.created_at,
    )
    return {
        "analysis": analysis,
        "assessment": {
            "predicted_category": assessment.predicted_category,
            "summary": assessment.summary,
            "language": assessment.language,
            "issue_entities": assessment.issue_entities,
            "urgency_indicators": assessment.urgency_indicators,
            "evidence": assessment.evidence,
            "explanation": assessment.explanation,
            "model_or_method": assessment.model_or_method,
            "confidence": assessment.confidence,
            "recommended_department": assessment.recommended_department,
            "department_reason": assessment.department_reason,
            "department_evidence": assessment.department_evidence,
            "department_rule": assessment.department_rule,
            "recommended_priority": assessment.recommended_priority,
            "priority_reason": assessment.priority_reason,
            "priority_evidence": assessment.priority_evidence,
            "priority_rules": assessment.priority_rules,
            "final_department_id": assessment.final_department_id,
            "final_priority": assessment.final_priority,
            "human_decision_reason": assessment.human_decision_reason,
            "analyzed_at": assessment.analyzed_at,
        },
        "similar_complaints": similar,
    }


@router.patch("/{complaint_id}/triage")
def apply_officer_triage(
    complaint_id: int,
    payload: OfficerTriageOverride,
    db: Session = Depends(get_db),
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if complaint is None:
        raise HTTPException(status_code=404, detail="Complaint not found")

    if payload.department_id is None and payload.priority is None:
        raise HTTPException(status_code=422, detail="Provide a department override, priority override, or both")

    if payload.department_id is not None:
        department = db.query(Department).filter(Department.id == payload.department_id).first()
        if department is None:
            raise HTTPException(status_code=404, detail="Department not found")

    assessment = complaint.ai_assessment
    if assessment is None:
        analysis = AIEngine().analyze(
            complaint.title,
            complaint.description,
            district=complaint.district,
            locality=complaint.locality,
        )
        assessment = AIAssessment(
            complaint_id=complaint.id,
            predicted_category=analysis["predicted_category"],
            summary=analysis["summary"],
            language=analysis["language"],
            issue_entities=analysis["issue_entities"],
            urgency_indicators=analysis["urgency_indicators"],
            evidence=analysis["evidence"],
            explanation=analysis["explanation"],
            model_or_method=analysis["model_or_method"],
            confidence=analysis["confidence"],
            recommended_department=analysis["recommended_department"],
            department_reason=analysis["department_reason"],
            department_evidence=analysis["department_evidence"],
            department_rule=analysis["department_rule"],
            recommended_priority=analysis["recommended_priority"],
            priority_reason=analysis["priority_rationale"],
            priority_evidence=analysis["priority_evidence"],
            priority_rules=analysis["priority_rules"],
        )
        db.add(assessment)

    try:
        normalized_reason = payload.reason.strip()
        if payload.department_id is not None:
            complaint.department_id = payload.department_id
            assessment.final_department_id = payload.department_id
        if payload.priority is not None:
            complaint.priority = payload.priority
            assessment.final_priority = payload.priority
        assessment.human_decision_reason = normalized_reason

        db.commit()
        db.refresh(complaint)
        db.refresh(assessment)
        return {
            "complaint_id": complaint.id,
            "status": complaint.status,
            "final_department_id": assessment.final_department_id,
            "final_priority": assessment.final_priority,
            "recommended_department": assessment.recommended_department,
            "recommended_priority": assessment.recommended_priority,
            "human_decision_reason": assessment.human_decision_reason,
        }
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database error while recording officer triage decision") from exc
