from fastapi import APIRouter
from backend.app.services.privacy_scanner import execute_privacy_scan, get_lan_devices

router = APIRouter(prefix="/privacy", tags=["Privacy Scanner"])


@router.get("/status")
def get_privacy_status():
    """Returns quick status of local LAN and camera scan readiness."""
    devices = get_lan_devices()
    return {
        "status": "ready",
        "active_lan_devices": len(devices),
        "engine": "Privacy Guard: OUI Video Classifier + RTSP/ONVIF Stream Inspector v1.0",
        "purpose": "Women's Safety & Hidden Surveillance Camera Detection"
    }


@router.post("/scan")
def run_privacy_camera_scan():
    """
    Scans the local Wi-Fi subnet and nearby physical airspace for hidden spy cameras,
    unauthorized RTSP video streams, and surveillance hardware.
    """
    return execute_privacy_scan()
