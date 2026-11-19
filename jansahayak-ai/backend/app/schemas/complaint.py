from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


ALLOWED_PRIORITIES = {"Low", "Medium", "High", "Critical"}
ALLOWED_STATUSES = {"Submitted", "Under Review", "In Progress", "Resolved", "Closed", "Rejected"}


class ComplaintCreate(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: str = Field(min_length=10, max_length=5000)
    language: str = Field(default="English", min_length=2, max_length=30)
    district: str = Field(min_length=2, max_length=100)
    locality: str = Field(min_length=2, max_length=200)
    category: str = Field(min_length=2, max_length=100)
    priority: str = Field(default="Medium", max_length=20)
    department_id: int | None = Field(default=None, gt=0)

    @field_validator("title", "description", "language", "district", "locality", "category")
    @classmethod
    def normalize_text(cls, value: str) -> str:
        normalized = " ".join(value.split())
        if not normalized:
            raise ValueError("Value cannot be blank")
        return normalized

    @field_validator("priority")
    @classmethod
    def validate_priority(cls, value: str) -> str:
        normalized = value.strip().title()
        if normalized not in ALLOWED_PRIORITIES:
            raise ValueError(f"Invalid priority. Allowed priorities: {', '.join(sorted(ALLOWED_PRIORITIES))}")
        return normalized


class ComplaintUpdate(BaseModel):
    status: str = Field(min_length=2, max_length=30)
    remarks: str | None = Field(default=None, max_length=2000)

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str) -> str:
        normalized = value.strip().title()
        if normalized not in ALLOWED_STATUSES:
            raise ValueError(f"Invalid status. Allowed statuses: {', '.join(sorted(ALLOWED_STATUSES))}")
        return normalized

    @field_validator("remarks")
    @classmethod
    def normalize_remarks(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        return normalized or None


class AIAssessmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    predicted_category: str = Field(min_length=1, max_length=50)
    summary: str = Field(min_length=1, max_length=5000)
    language: str = Field(max_length=20)
    issue_entities: list[str] = Field(default_factory=list)
    urgency_indicators: list[str] = Field(default_factory=list)
    evidence: list[str] = Field(default_factory=list)
    explanation: str = Field(min_length=1, max_length=5000)
    model_or_method: str = Field(max_length=100)
    confidence: float = Field(ge=0.0, le=1.0)
    analyzed_at: datetime


class StatusHistoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: str
    remarks: str | None
    changed_at: datetime


class ComplaintResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    reference_id: str
    title: str
    description: str
    language: str
    district: str
    locality: str
    category: str
    priority: str
    department_id: int | None
    status: str
    created_at: datetime
    status_history: list[StatusHistoryResponse] = Field(default_factory=list)
    ai_assessment: AIAssessmentResponse | None = None
