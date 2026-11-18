from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.complaint import Complaint

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/summary")
def dashboard_summary(db: Session = Depends(get_db)):
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

    return {
        "total_complaints": total,
        "by_status": {status_name: count for status_name, count in status_rows},
        "by_priority": {priority: count for priority, count in priority_rows},
    }
