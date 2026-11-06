from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class CaptureBase(BaseModel):
    filename: str
    source_type: str = "csv"


class CaptureCreate(CaptureBase):
    pass


class CaptureResponse(CaptureBase):
    id: int
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    checksum: Optional[str] = None
    record_count: int
    status: str
    imported_at: datetime

    class Config:
        from_attributes = True
