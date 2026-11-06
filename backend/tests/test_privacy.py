import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.privacy_scanner import execute_privacy_scan, get_lan_devices, is_port_open

client = TestClient(app)

def test_privacy_status():
    response = client.get("/api/privacy/status")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ready"
    assert "active_lan_devices" in data
    assert "engine" in data
    assert "purpose" in data
    assert "Women's Safety" in data["purpose"]

def test_privacy_scan_endpoint():
    response = client.post("/api/privacy/scan")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "completed"
    assert data["verdict"] in ["AIRSPACE_SAFE", "CAMERAS_DETECTED", "SUSPICIOUS_IOT"]
    assert "summary" in data
    assert "scanned_devices_count" in data
    assert "cameras_found" in data
    assert "suspicious_found" in data
    assert "subnet_devices" in data
    assert "airspace_camera_beacons" in data
    assert "safety_tips" in data
    assert len(data["safety_tips"]) >= 4
    
    # Check physical safety tips for women and travelers
    tip_titles = [t["title"] for t in data["safety_tips"]]
    assert any("Lens" in t for t in tip_titles)
    assert any("Mirror" in t for t in tip_titles)

def test_direct_execute_privacy_scan():
    result = execute_privacy_scan()
    assert isinstance(result, dict)
    assert "verdict" in result
    assert "subnet_devices" in result
    assert "elapsed_ms" in result
    assert isinstance(result["subnet_devices"], list)
    for dev in result["subnet_devices"]:
        assert "risk_level" in dev
        assert "risk_reasons" in dev
        assert "medium" in dev
