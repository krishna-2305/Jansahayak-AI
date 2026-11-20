from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.complaint import Complaint
from app.models.department import Department
from app.services.recurring_issue_service import analyze_recurring_issues

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/summary")
def dashboard_summary(db: Session = Depends(get_db)):
    try:
        total = db.query(func.count(Complaint.id)).scalar() or 0

        status_rows = (
            db.query(Complaint.status, func.count(Complaint.id))
            .group_by(Complaint.status)
            .all()
        )
        priority_rows = (
            db.query(Complaint.priority, func.count(Complaint.id))
            .group_by(Complaint.priority)
            .all()
        )
        category_rows = (
            db.query(Complaint.category, func.count(Complaint.id))
            .group_by(Complaint.category)
            .all()
        )

        department_rows = (
            db.query(Department.name, func.count(Complaint.id))
            .outerjoin(Complaint, Complaint.department_id == Department.id)
            .group_by(Department.id, Department.name)
            .all()
        )
        unassigned = db.query(func.count(Complaint.id)).filter(Complaint.department_id.is_(None)).scalar() or 0

        department_counts = {name: count for name, count in department_rows if count > 0}
        if unassigned:
            department_counts["Unassigned"] = unassigned

        return {
            "total_complaints": total,
            "by_status": {status_name: count for status_name, count in status_rows},
            "by_priority": {priority: count for priority, count in priority_rows},
            "by_category": {category: count for category, count in category_rows},
            "by_department": department_counts,
        }
    except SQLAlchemyError as exc:
        raise HTTPException(status_code=500, detail="Database error while generating dashboard summary") from exc


@router.get("/recurring-issues")
def recurring_issue_intelligence(
    days: int = 30,
    minimum_complaints: int = 2,
    district: str | None = None,
    locality: str | None = None,
    category: str | None = None,
    department_id: int | None = None,
    db: Session = Depends(get_db),
):
    if days < 1 or days > 365:
        raise HTTPException(status_code=422, detail="days must be between 1 and 365")
    if minimum_complaints < 2 or minimum_complaints > 100:
        raise HTTPException(status_code=422, detail="minimum_complaints must be between 2 and 100")

    if department_id is not None:
        department = db.query(Department).filter(Department.id == department_id).first()
        if department is None:
            raise HTTPException(status_code=404, detail="Department not found")

    try:
        return analyze_recurring_issues(
            db,
            days=days,
            minimum_complaints=minimum_complaints,
            district=district,
            locality=locality,
            category=category,
            department_id=department_id,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Database error while generating recurring issue intelligence") from exc
