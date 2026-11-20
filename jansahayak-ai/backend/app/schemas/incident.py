from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class IncidentCreate(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    complaint_ids: list[int] = Field(min_length=1)
    district: str | None = Field(default=None, max_length=100)
    locality: str | None = Field(default=None, max_length=200)
    department_id: int | None = Field(default=None, gt=0)
    severity: str = Field(default="Medium", max_length=20)
    notes: str | None = Field(default=None, max_length=2000)


class IncidentReview(BaseModel):
    complaint_id: int = Field(gt=0)
    decision: str = Field(min_length=6, max_length=20)
    officer_decision_reason: str | None = Field(default=None, max_length=2000)

    @field_validator("decision")
    @classmethod
    def validate_decision(cls, value: str) -> str:
        normalized = value.strip().lower()
        if normalized not in {"confirm", "reject"}:
            raise ValueError("Decision must be confirm or reject")
        return normalized


class IncidentComplaintResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    complaint_id: int
    reference_id: str
    similarity_score: float
    matching_signals: dict
    review_status: str
    officer_decision: str | None
    review_timestamp: datetime | None


class IncidentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    district: str | None
    locality: str | None
    department_id: int | None
    severity: str
    notes: str | None
    created_at: datetime
    complaints: list[IncidentComplaintResponse] = Field(default_factory=list)
