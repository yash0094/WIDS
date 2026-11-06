import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_health_endpoint():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "service" in data


def test_evaluation_metrics_endpoint():
    res = client.get("/api/evaluation/metrics")
    assert res.status_code == 200
    data = res.json()
    assert "model_version" in data
    assert "per_class_metrics" in data
    assert "confusion_matrix" in data


def test_evaluation_scenarios_endpoint():
    res = client.get("/api/evaluation/scenarios")
    assert res.status_code == 200
    scenarios = res.json()
    assert len(scenarios) >= 8
    # All benchmark test scenarios should pass
    assert all(s["passed"] for s in scenarios)


def test_incidents_list_endpoint():
    res = client.get("/api/incidents")
    assert res.status_code == 200
    incidents = res.json()
    assert isinstance(incidents, list)


def test_incident_detail_and_review_workflow():
    import os
    from backend.app.db.database import SessionLocal
    from backend.app.services.ingestion import ingest_file_pipeline
    from backend.app.db.models import Incident, AnalystReview, EventEdge, IncidentEvent, Detection, Event, Capture, Report

    res = client.get("/api/incidents")
    assert res.status_code == 200
    incidents = res.json()

    cleaned_up = False
    if len(incidents) == 0:
        db = SessionLocal()
        sample_path = os.path.join(os.path.dirname(__file__), "..", "..", "data", "samples", "wifi_scenario_rogue_ap_evil_twin.csv")
        ingest_file_pipeline(sample_path, db)
        db.close()
        incidents = client.get("/api/incidents").json()
        cleaned_up = True

    try:
        first_id = incidents[0]["id"]

        # 2. Get detail with Cytoscape elements and narrative
        detail_res = client.get(f"/api/incidents/{first_id}")
        assert detail_res.status_code == 200
        detail = detail_res.json()
        assert "narrative" in detail
        assert "cytoscape_elements" in detail
        assert "observed_facts" in detail["narrative"]

        # 3. Submit analyst review
        review_payload = {
            "reviewer_decision": "confirmed",
            "notes": "Pytest automated verification: confirmed rogue attack signature.",
            "reviewer_name": "QA Test Bot"
        }
        review_res = client.post(f"/api/incidents/{first_id}/review", json=review_payload)
        assert review_res.status_code == 200
        rev = review_res.json()
        assert rev["reviewer_decision"] == "confirmed"

        # 4. Generate structured report
        rep_res = client.post(f"/api/reports/generate/{first_id}")
        assert rep_res.status_code == 200
        rep = rep_res.json()
        assert "content_json" in rep
        assert rep["incident_id"] == first_id

    finally:
        if cleaned_up:
            db = SessionLocal()
            db.query(AnalystReview).delete()
            db.query(EventEdge).delete()
            db.query(IncidentEvent).delete()
            db.query(Incident).delete()
            db.query(Detection).delete()
            db.query(Event).delete()
            db.query(Capture).delete()
            db.query(Report).delete()
            db.commit()
            db.close()
