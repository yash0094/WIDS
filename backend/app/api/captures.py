import os
import shutil
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.orm import Session

from backend.app.db.database import get_db
from backend.app.db.models import Capture
from backend.app.schemas.capture import CaptureResponse
from backend.app.services.ingestion import ingest_file_pipeline

router = APIRouter(prefix="/captures", tags=["Captures"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), "data", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.get("", response_model=List[CaptureResponse])
def list_captures(db: Session = Depends(get_db)):
    """List all imported captures ordered by import timestamp."""
    return db.query(Capture).order_by(Capture.imported_at.desc()).all()


@router.get("/{capture_id}", response_model=CaptureResponse)
def get_capture(capture_id: int, db: Session = Depends(get_db)):
    """Retrieve metadata and status for a specific capture."""
    cap = db.query(Capture).filter(Capture.id == capture_id).first()
    if not cap:
        raise HTTPException(status_code=404, detail="Capture not found")
    return cap


@router.post("/upload", response_model=dict)
async def upload_capture(
    file: UploadFile = File(...),
    source_type: Optional[str] = Form("csv"),
    db: Session = Depends(get_db)
):
    """
    Upload and immediately process a CSV or PCAP capture file.
    Runs ingestion, feature normalization, RF detection, SHAP explainability, and correlation.
    """
    safe_name = os.path.basename(file.filename)
    dest_path = os.path.join(UPLOAD_DIR, safe_name)

    with open(dest_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    actual_source = "pcap" if safe_name.lower().endswith(".pcap") else "csv"
    try:
        result = ingest_file_pipeline(dest_path, db, source_type=actual_source)
        return {"status": "success", "message": "Capture imported and analyzed successfully", **result}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process capture file: {str(e)}")


@router.post("/import-sample/{scenario_name}", response_model=dict)
def import_sample_scenario(scenario_name: str, db: Session = Depends(get_db)):
    """
    Load and process one of the pre-built capstone benchmark scenarios.
    """
    base_proj = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    sample_file = os.path.join(base_proj, "data", "samples", f"{scenario_name}.csv")

    if not os.path.exists(sample_file):
        # Try checking for .pcap
        pcap_file = os.path.join(base_proj, "data", "samples", f"{scenario_name}.pcap")
        if os.path.exists(pcap_file):
            sample_file = pcap_file
        else:
            raise HTTPException(status_code=404, detail=f"Scenario file '{scenario_name}' not found in samples directory.")

    src_type = "pcap" if sample_file.endswith(".pcap") else "csv"
    try:
        result = ingest_file_pipeline(sample_file, db, source_type=src_type)
        return {"status": "success", "message": f"Sample scenario '{scenario_name}' imported successfully", **result}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to import scenario: {str(e)}")
