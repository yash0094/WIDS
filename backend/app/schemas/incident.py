from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel
from backend.app.schemas.event import EventResponse


class EdgeResponse(BaseModel):
    id: int
    incident_id: int
    from_event_id: int
    to_event_id: int
    relationship_type: str  # temporal, shared_entity, pattern_match, analyst_confirmed
    reason: str
    time_delta_seconds: float
    rule_version: str
    evidence_json: Dict[str, Any]

    class Config:
        from_attributes = True


class AnalystReviewCreate(BaseModel):
    reviewer_decision: str  # confirmed, rejected, needs_more_evidence
    notes: str
    reviewer_name: Optional[str] = "Security Analyst"


class AnalystReviewResponse(BaseModel):
    id: int
    incident_id: int
    reviewer_decision: str
    notes: str
    reviewer_name: str
    created_at: datetime

    class Config:
        from_attributes = True


class IncidentBase(BaseModel):
    title: str
    status: str = "candidate"
    severity: str = "MEDIUM"
    attack_type: str
    primary_entity: Optional[str] = None


class IncidentListItem(IncidentBase):
    id: int
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    event_count: int
    created_at: datetime
    updated_at: datetime
    latest_review: Optional[AnalystReviewResponse] = None

    class Config:
        from_attributes = True


class NarrativeClaim(BaseModel):
    claim: str
    supporting_event_ids: List[int]
    confidence_level: str  # Observed, Model-predicted, Inferred-Hypothesis, Unknown
    evidence_note: str


class NarrativeResponse(BaseModel):
    title: str
    status: str
    observed_facts: List[NarrativeClaim]
    chronological_narrative: str
    attack_hypothesis: str
    alternative_explanations: List[str]
    missing_evidence_and_unknowns: List[str]
    recommended_investigation_steps: List[str]


class IncidentDetailResponse(IncidentBase):
    id: int
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    analyst_summary: Optional[str] = None
    events: List[EventResponse]
    edges: List[EdgeResponse]
    narrative: NarrativeResponse
    reviews: List[AnalystReviewResponse]
    cytoscape_elements: List[Dict[str, Any]]

    class Config:
        from_attributes = True
