from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ComplaintCreate(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: str = Field(min_length=10)
    language: str = Field(default="English", max_length=30)
    district: str = Field(min_length=2, max_length=100)
    locality: str = Field(min_length=2, max_length=200)
    category: str = Field(min_length=2, max_length=100)
    priority: str = Field(default="Medium", max_length=20)
    department_id: int | None = None


class ComplaintUpdate(BaseModel):
    status: str = Field(min_length=2, max_length=30)


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
