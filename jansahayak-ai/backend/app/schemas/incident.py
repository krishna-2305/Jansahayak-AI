from datetime import datetime

from pydantic import BaseModel, ConfigDict


class IncidentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    complaint_id: int
    department_id: int | None
    severity: str
    notes: str | None
    created_at: datetime
