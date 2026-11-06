from typing import Dict, Any, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.db.database import get_db
from backend.app.db.models import Incident, Event, EventEdge, IncidentEvent
from backend.app.services.gemini_service import (
    get_stored_api_key,
    save_stored_api_key,
    is_gemini_configured,
    analyze_event_with_gemini,
    analyze_incident_narrative_with_gemini
)

router = APIRouter(prefix="/gemini", tags=["Gemini AI Engine"])


class GeminiConfigRequest(BaseModel):
    api_key: str


class GeminiAnalyzeRequest(BaseModel):
    features: Dict[str, Any]
    entity_ids: Dict[str, Any]


@router.get("/config")
def get_gemini_config():
    """Returns Gemini AI status and model information."""
    key = get_stored_api_key()
    masked = f"{key[:6]}...{key[-4:]}" if key and len(key) > 10 else None
    return {
        "configured": is_gemini_configured(),
        "model": "gemini-2.5-flash",
        "api_key_masked": masked,
        "mode": "Gemini-2.5-Flash (Cloud)" if is_gemini_configured() else "Gemini Protocol Engine (Local Mode)"
    }


@router.post("/config")
def set_gemini_config(req: GeminiConfigRequest):
    """Sets the Gemini API key and validates it."""
    if not req.api_key or len(req.api_key.strip()) < 10:
        raise HTTPException(status_code=400, detail="Invalid API key format")

    save_stored_api_key(req.api_key.strip())
    return {
        "status": "success",
        "message": "Gemini API key saved successfully.",
        "configured": True,
        "model": "gemini-2.5-flash"
    }


@router.post("/analyze-event")
def analyze_single_event(req: GeminiAnalyzeRequest):
    """Submits local 802.11 features to Gemini for real-time classification and feature attributions."""
    return analyze_event_with_gemini(req.features, req.entity_ids)


@router.post("/reanalyze-incident/{incident_id}")
def reanalyze_incident(incident_id: int, db: Session = Depends(get_db)):
    """
    Submits local incident telemetry and correlated events to Gemini API.
    Returns the real-time Gemini-generated investigation narrative, hypothesis, and benign alternatives.
    """
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    incident_events = (
        db.query(Event)
        .join(IncidentEvent, IncidentEvent.event_id == Event.id)
        .filter(IncidentEvent.incident_id == incident_id)
        .order_by(Event.timestamp.asc())
        .all()
    )
    edges = db.query(EventEdge).filter(EventEdge.incident_id == incident_id).all()

    event_dicts = [
        {
            "id": ev.id,
            "timestamp": ev.timestamp,
            "event_type": ev.event_type,
            "source_ref": ev.source_ref,
            "entity_ids": ev.entity_ids,
            "features_json": ev.features_json
        }
        for ev in incident_events
    ]

    edge_dicts = [
        {
            "from_event_id": e.from_event_id,
            "to_event_id": e.to_event_id,
            "relationship_type": e.relationship_type,
            "reason": e.reason,
            "time_delta_seconds": e.time_delta_seconds
        }
        for e in edges
    ]

    inc_dict = {
        "id": inc.id,
        "title": inc.title,
        "status": inc.status,
        "severity": inc.severity,
        "attack_type": inc.attack_type,
        "primary_entity": inc.primary_entity,
        "start_time": str(inc.start_time),
        "end_time": str(inc.end_time)
    }

    narrative = analyze_incident_narrative_with_gemini(inc_dict, event_dicts, edge_dicts)

    # Persist the updated summary into the incident
    inc.analyst_summary = narrative.get("chronological_narrative")
    db.commit()

    return {
        "incident_id": incident_id,
        "narrative": narrative,
        "engine": narrative.get("ai_engine", "Gemini 2.5 Flash")
    }
