from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.db.database import get_db
from backend.app.db.models import Incident, Report, IncidentEvent, Event, EventEdge, AnalystReview
from backend.app.schemas.report import ReportResponse, ReportCreate
from backend.app.services.investigation import generate_investigation_narrative
from backend.app.services.reporting import generate_structured_report

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.post("/generate/{incident_id}", response_model=ReportResponse)
def generate_incident_report(incident_id: int, db: Session = Depends(get_db)):
    """
    Generates a formal evidence-linked investigation report for an incident.
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
    reviews = db.query(AnalystReview).filter(AnalystReview.incident_id == incident_id).all()

    event_dicts = [
        {
            "id": ev.id,
            "timestamp": ev.timestamp,
            "event_type": ev.event_type,
            "source_ref": ev.source_ref,
            "entity_ids": ev.entity_ids,
            "features_json": ev.features_json,
            "detection": {
                "predicted_label": ev.detection.predicted_label,
                "score_json": ev.detection.score_json,
                "explanation_json": ev.detection.explanation_json,
                "model_version": ev.detection.model_version
            } if ev.detection else {}
        }
        for ev in incident_events
    ]

    edge_dicts = [
        {
            "from_event_id": e.from_event_id,
            "to_event_id": e.to_event_id,
            "relationship_type": e.relationship_type,
            "reason": e.reason,
            "time_delta_seconds": e.time_delta_seconds,
            "rule_version": e.rule_version
        }
        for e in edges
    ]

    review_dicts = [
        {
            "reviewer_decision": r.reviewer_decision,
            "notes": r.notes,
            "reviewer_name": r.reviewer_name,
            "created_at": r.created_at
        }
        for r in reviews
    ]

    inc_dict = {
        "id": inc.id,
        "title": inc.title,
        "status": inc.status,
        "severity": inc.severity,
        "attack_type": inc.attack_type,
        "primary_entity": inc.primary_entity,
        "start_time": inc.start_time,
        "end_time": inc.end_time
    }

    narrative = generate_investigation_narrative(inc_dict, event_dicts, edge_dicts)
    content_json = generate_structured_report(inc_dict, narrative, event_dicts, edge_dicts, review_dicts)

    report = Report(
        incident_id=incident_id,
        report_version="1.0",
        content_json=content_json
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    return report


@router.get("", response_model=List[ReportResponse])
def list_reports(db: Session = Depends(get_db)):
    """List all saved investigation reports."""
    return db.query(Report).order_by(Report.generated_at.desc()).all()


@router.get("/user-guide.pdf")
def download_user_guide_pdf():
    """Directly downloads the comprehensive PDF documentation manual."""
    import os
    from fastapi.responses import FileResponse
    pdf_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "docs", "Wireless-IDS_Documentation_and_User_Guide.pdf"))
    if os.path.exists(pdf_path):
        return FileResponse(pdf_path, media_type="application/pdf", filename="Wireless-IDS_Documentation_and_User_Guide.pdf")
    raise HTTPException(status_code=404, detail="PDF manual not found")


@router.get("/{report_id}", response_model=ReportResponse)
def get_report(report_id: int, db: Session = Depends(get_db)):
    """Retrieve report content by report ID."""
    rep = db.query(Report).filter(Report.id == report_id).first()
    if not rep:
        raise HTTPException(status_code=404, detail="Report not found")
    return rep
