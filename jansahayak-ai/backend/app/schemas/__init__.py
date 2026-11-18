"""Pydantic schemas."""

from app.schemas.complaint import ComplaintCreate, ComplaintResponse, ComplaintUpdate
from app.schemas.department import DepartmentResponse
from app.schemas.incident import IncidentResponse

__all__ = [
    "ComplaintCreate",
    "ComplaintResponse",
    "ComplaintUpdate",
    "DepartmentResponse",
    "IncidentResponse",
]
