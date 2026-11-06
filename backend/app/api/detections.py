from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.db.database import get_db
from backend.app.db.models import Capture, Event, Detection
from backend.app.schemas.event import DetectionResponse
from backend.app.services.detection import classify_features
from backend.app.services.explainability import explain_prediction

router = APIRouter(prefix="/detections", tags=["Detections"])


@router.post("/classify-raw", response_model=Dict[str, Any])
def classify_raw_features(features: Dict[str, Any]):
    """
    On-demand inference and SHAP explanation for an arbitrary 802.11 feature payload.
    """
    det_result = classify_features(features)
    pred_label = det_result["predicted_label"]
    explanation = explain_prediction(features, pred_label)

    return {
        **det_result,
        "explanation": explanation
    }


@router.get("/{detection_id}", response_model=DetectionResponse)
def get_detection(detection_id: int, db: Session = Depends(get_db)):
    """Retrieve detection output and stored SHAP explanation by detection ID."""
    det = db.query(Detection).filter(Detection.id == detection_id).first()
    if not det:
        raise HTTPException(status_code=404, detail="Detection not found")
    return det
