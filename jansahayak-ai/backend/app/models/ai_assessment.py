from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class AIAssessment(Base):
    __tablename__ = "ai_assessments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    complaint_id: Mapped[int] = mapped_column(
        ForeignKey("complaints.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    predicted_category: Mapped[str] = mapped_column(String(50), nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    language: Mapped[str] = mapped_column(String(20), nullable=False)
    issue_entities: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    urgency_indicators: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    evidence: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    explanation: Mapped[str] = mapped_column(Text, nullable=False)
    model_or_method: Mapped[str] = mapped_column(String(100), nullable=False)
    confidence: Mapped[float] = mapped_column(nullable=False, default=0.0)
    recommended_department: Mapped[str | None] = mapped_column(String(100), nullable=True)
    department_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    department_evidence: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    department_rule: Mapped[str | None] = mapped_column(String(200), nullable=True)
    recommended_priority: Mapped[str] = mapped_column(String(20), nullable=False, default="Medium")
    priority_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    priority_evidence: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    priority_rules: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    final_department_id: Mapped[int | None] = mapped_column(
        ForeignKey("departments.id", ondelete="SET NULL"),
        nullable=True,
    )
    final_priority: Mapped[str | None] = mapped_column(String(20), nullable=True)
    human_decision_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    analyzed_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )

    complaint = relationship("Complaint", back_populates="ai_assessment")
