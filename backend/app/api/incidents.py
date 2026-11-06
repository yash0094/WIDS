from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.app.db.database import get_db
from backend.app.db.models import Incident, IncidentEvent, Event, EventEdge, AnalystReview
from backend.app.schemas.incident import (
    IncidentListItem,
    IncidentDetailResponse,
    AnalystReviewCreate,
    AnalystReviewResponse,
    EdgeResponse
)
from backend.app.schemas.event import EventResponse
from backend.app.services.graph_builder import format_cytoscape_elements
from backend.app.services.gemini_service import analyze_incident_narrative_with_gemini


router = APIRouter(prefix="/incidents", tags=["Incidents"])


@router.get("", response_model=List[IncidentListItem])
def list_incidents(
    status: Optional[str] = Query(None, description="Filter by status"),
    severity: Optional[str] = Query(None, description="Filter by severity"),
    attack_type: Optional[str] = Query(None, description="Filter by attack type"),
    db: Session = Depends(get_db)
):
    """
    List candidate and reviewed incidents with summary metrics.
    """
    query = db.query(Incident)

    if status:
        query = query.filter(Incident.status == status)
    if severity:
        query = query.filter(Incident.severity == severity)
    if attack_type:
        query = query.filter(Incident.attack_type == attack_type)

    incidents = query.order_by(Incident.updated_at.desc()).all()

    items = []
    for inc in incidents:
        # Get count of associated events
        count = db.query(IncidentEvent).filter(IncidentEvent.incident_id == inc.id).count()
        latest_review = db.query(AnalystReview).filter(AnalystReview.incident_id == inc.id).order_by(AnalystReview.created_at.desc()).first()

        items.append(IncidentListItem(
            id=inc.id,
            title=inc.title,
            status=inc.status,
            severity=inc.severity,
            attack_type=inc.attack_type,
            primary_entity=inc.primary_entity,
            start_time=inc.start_time,
            end_time=inc.end_time,
            event_count=count,
            created_at=inc.created_at,
            updated_at=inc.updated_at,
            latest_review=AnalystReviewResponse.model_validate(latest_review) if latest_review else None
        ))
    return items


@router.get("/{incident_id}", response_model=IncidentDetailResponse)
def get_incident_detail(incident_id: int, db: Session = Depends(get_db)):
    """
    Retrieve full investigation details for an incident:
    - Evidence events and raw features
    - Cytoscape.js correlation graph elements and edge reasons
    - Chronological timeline
    - Structured investigation narrative with citations
    - Analyst review history
    """
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    # Fetch ordered events
    incident_events = (
        db.query(Event)
        .join(IncidentEvent, IncidentEvent.event_id == Event.id)
        .filter(IncidentEvent.incident_id == incident_id)
        .order_by(Event.timestamp.asc())
        .all()
    )

    # Fetch edges
    edges = db.query(EventEdge).filter(EventEdge.incident_id == incident_id).all()
    edge_dicts = [
        {
            "id": e.id,
            "incident_id": e.incident_id,
            "from_event_id": e.from_event_id,
            "to_event_id": e.to_event_id,
            "relationship_type": e.relationship_type,
            "reason": e.reason,
            "time_delta_seconds": e.time_delta_seconds,
            "rule_version": e.rule_version,
            "evidence_json": e.evidence_json
        }
        for e in edges
    ]

    event_dicts = []
    for ev in incident_events:
        det = ev.detection
        event_dicts.append({
            "id": ev.id,
            "capture_id": ev.capture_id,
            "timestamp": ev.timestamp,
            "event_type": ev.event_type,
            "source_ref": ev.source_ref,
            "entity_ids": ev.entity_ids,
            "features_json": ev.features_json,
            "created_at": ev.created_at,
            "detection": {
                "id": det.id,
                "event_id": det.event_id,
                "model_version": det.model_version,
                "predicted_label": det.predicted_label,
                "score_json": det.score_json,
                "explanation_json": det.explanation_json,
                "created_at": det.created_at
            } if det else None
        })

    # Cytoscape elements
    cy_elements = format_cytoscape_elements(event_dicts, edge_dicts)

    # Generate structured narrative
    inc_info = {
        "id": inc.id,
        "title": inc.title,
        "status": inc.status,
        "severity": inc.severity,
        "attack_type": inc.attack_type,
        "primary_entity": inc.primary_entity,
        "start_time": inc.start_time,
        "end_time": inc.end_time
    }
    narrative = analyze_incident_narrative_with_gemini(inc_info, event_dicts, edge_dicts)


    # Reviews
    reviews = db.query(AnalystReview).filter(AnalystReview.incident_id == incident_id).order_by(AnalystReview.created_at.desc()).all()

    return IncidentDetailResponse(
        id=inc.id,
        title=inc.title,
        status=inc.status,
        severity=inc.severity,
        attack_type=inc.attack_type,
        primary_entity=inc.primary_entity,
        start_time=inc.start_time,
        end_time=inc.end_time,
        created_at=inc.created_at,
        updated_at=inc.updated_at,
        analyst_summary=inc.analyst_summary,
        events=[EventResponse.model_validate(e) for e in incident_events],
        edges=[EdgeResponse.model_validate(e) for e in edges],
        narrative=narrative,
        reviews=[AnalystReviewResponse.model_validate(r) for r in reviews],
        cytoscape_elements=cy_elements
    )


@router.post("/{incident_id}/review", response_model=AnalystReviewResponse)
def submit_analyst_review(
    incident_id: int,
    review_data: AnalystReviewCreate,
    db: Session = Depends(get_db)
):
    """
    Records human-in-the-loop analyst assessment:
    - Decisions: 'confirmed', 'rejected', 'needs_more_evidence'
    - Updates incident workflow status and audit log
    """
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    valid_decisions = ["confirmed", "rejected", "needs_more_evidence"]
    if review_data.reviewer_decision not in valid_decisions:
        raise HTTPException(status_code=400, detail=f"Decision must be one of {valid_decisions}")

    # Create Review Record
    review = AnalystReview(
        incident_id=incident_id,
        reviewer_decision=review_data.reviewer_decision,
        notes=review_data.notes,
        reviewer_name=review_data.reviewer_name or "Security Analyst"
    )
    db.add(review)

    # Update incident status
    if review_data.reviewer_decision == "confirmed":
        inc.status = "analyst_confirmed"
    elif review_data.reviewer_decision == "rejected":
        inc.status = "rejected"
    else:
        inc.status = "needs_more_evidence"

    inc.analyst_summary = review_data.notes
    db.commit()
    db.refresh(review)

    return review
