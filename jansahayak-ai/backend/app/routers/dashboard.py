from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.complaint import Complaint
from app.models.department import Department

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
