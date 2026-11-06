from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.app.db.database import get_db
from backend.app.db.models import Event, Detection
from backend.app.schemas.event import EventResponse

router = APIRouter(prefix="/events", tags=["Events"])


@router.get("", response_model=List[EventResponse])
def list_events(
    capture_id: Optional[int] = Query(None, description="Filter by capture ID"),
    event_type: Optional[str] = Query(None, description="Filter by event type"),
    predicted_label: Optional[str] = Query(None, description="Filter by model prediction"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """
    Query normalized security events with optional filters on capture, type, and prediction.
    """
    query = db.query(Event)

    if capture_id:
        query = query.filter(Event.capture_id == capture_id)
    if event_type:
        query = query.filter(Event.event_type.ilike(f"%{event_type}%"))
    if predicted_label:
        query = query.join(Detection).filter(Detection.predicted_label == predicted_label)

    return query.order_by(Event.timestamp.desc()).offset(offset).limit(limit).all()


@router.get("/{event_id}", response_model=EventResponse)
def get_event(event_id: int, db: Session = Depends(get_db)):
    """
    Retrieve full details of an individual security event, including SHAP explanations.
    """
    ev = db.query(Event).filter(Event.id == event_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")
    return ev
