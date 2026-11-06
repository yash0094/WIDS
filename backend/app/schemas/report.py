from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel


class ReportCreate(BaseModel):
    incident_id: int
    notes: Optional[str] = None


class ReportResponse(BaseModel):
    id: int
    incident_id: int
    generated_at: datetime
    report_version: str
    content_json: Dict[str, Any]

    class Config:
        from_attributes = True
