import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_scanner_status():
    response = client.get("/api/scanner/status")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ready"
    assert "channel" in data
    assert "Random Forest" in data["engine"]


def test_scanner_environment():
    response = client.get("/api/scanner/environment")
    assert response.status_code == 200
    data = response.json()
    assert "adapter_name" in data
    assert "ssid" in data
    assert "channel" in data


def test_scanner_real_hardware_run():
    response = client.post("/api/scanner/run", json={"scan_mode": "real", "clear_previous": True})
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "completed"
    assert data["scan_mode"] == "real"
    assert "real_hardware" in data
    assert len(data["radar_blips"]) > 0
    assert len(data["telemetry_stream"]) > 0


def test_scanner_threat_audit_demo_run():
    response = client.post("/api/scanner/run", json={"scan_mode": "demo", "demo_scenario": "threat_audit", "clear_previous": True})
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "completed"
    assert data["scan_mode"] == "demo"
    assert data["threats_found"] >= 1
    assert data["incident_id"] is not None
    assert len(data["radar_blips"]) > 0
    assert len(data["telemetry_stream"]) > 0
    threat_blips = [b for b in data["radar_blips"] if b["status"] == "threat"]
    assert len(threat_blips) >= 1


def test_scanner_clean_demo_run():
    response = client.post("/api/scanner/run", json={"scan_mode": "demo", "demo_scenario": "clean", "clear_previous": True})
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "completed"
    assert data["threats_found"] == 0
    assert data["incident_id"] is None
