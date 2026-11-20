from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, JSON, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Incident(Base):
    __tablename__ = "incidents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False, default="Proposed Incident")
    district: Mapped[str | None] = mapped_column(String(100), nullable=True)
    locality: Mapped[str | None] = mapped_column(String(200), nullable=True)
    department_id: Mapped[int | None] = mapped_column(ForeignKey("departments.id"), nullable=True)
    severity: Mapped[str] = mapped_column(String(20), default="Medium", nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    department = relationship("Department", back_populates="incidents")
    associations = relationship("IncidentComplaint", back_populates="incident", cascade="all, delete-orphan")


class IncidentComplaint(Base):
    __tablename__ = "incident_complaints"
    __table_args__ = (UniqueConstraint("incident_id", "complaint_id", name="uq_incident_complaint"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    incident_id: Mapped[int] = mapped_column(ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False)
    complaint_id: Mapped[int] = mapped_column(ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False)
    similarity_score: Mapped[float] = mapped_column(nullable=False, default=0.0)
    matching_signals: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    review_status: Mapped[str] = mapped_column(String(20), nullable=False, default="Proposed")
    officer_decision: Mapped[str | None] = mapped_column(String(20), nullable=True)
    review_timestamp: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    incident = relationship("Incident", back_populates="associations")
    complaint = relationship("Complaint", back_populates="incident_associations")

    @property
    def reference_id(self) -> str:
        return self.complaint.reference_id
