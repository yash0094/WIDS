from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel


class DetectionResponse(BaseModel):
    id: int
    event_id: int
    model_version: str
    predicted_label: str
    score_json: Dict[str, Any]
    explanation_json: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True


class EventBase(BaseModel):
    timestamp: datetime
    event_type: str
    source_ref: Optional[str] = None
    entity_ids: Dict[str, Any] = {}
    features_json: Dict[str, Any] = {}


class EventCreate(EventBase):
    capture_id: int


class EventResponse(EventBase):
    id: int
    capture_id: int
    created_at: datetime
    detection: Optional[DetectionResponse] = None

    class Config:
        from_attributes = True


class EventFilterParams(BaseModel):
    capture_id: Optional[int] = None
    event_type: Optional[str] = None
    predicted_label: Optional[str] = None
    entity_query: Optional[str] = None
    limit: int = 100
    offset: int = 0
