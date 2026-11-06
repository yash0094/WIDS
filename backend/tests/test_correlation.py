import pytest
from datetime import datetime, timedelta
from backend.app.services.correlation import evaluate_edge_candidate
from backend.app.services.graph_builder import build_incident_graph


def test_correlation_linking_related_events():
    t0 = datetime(2026, 10, 22, 10, 0, 0)
    event1 = {
        "id": 1,
        "timestamp": t0,
        "predicted_label": "Deauth_Attack",
        "entity_ids": {
            "src_mac": "00:14:6C:7E:40:80",
            "dst_mac": "40:4E:36:12:34:56",
            "bssid": "00:14:6C:7E:40:80",
            "ssid": "Corp_Secure_Net",
            "channel": 6
        }
    }
    event2 = {
        "id": 2,
        "timestamp": t0 + timedelta(seconds=12.0),
        "predicted_label": "Disassoc_Attack",
        "entity_ids": {
            "src_mac": "00:14:6C:7E:40:80",
            "dst_mac": "40:4E:36:12:34:56",
            "bssid": "00:14:6C:7E:40:80",
            "ssid": "Corp_Secure_Net",
            "channel": 6
        }
    }

    edge = evaluate_edge_candidate(event1, event2)
    assert edge is not None
    assert edge["from_event_id"] == 1
    assert edge["to_event_id"] == 2
    assert edge["relationship_type"] == "pattern_match"
    assert "Forced Disconnection Phase" in edge["reason"]


def test_correlation_rejects_unrelated_alerts_close_in_time():
    """
    Minimum test scenario 4 from Section 11 of the guide:
    Unrelated alerts close in time must NOT be linked solely because timestamps are close.
    """
    t0 = datetime(2026, 10, 22, 12, 0, 0)
    event_ap1 = {
        "id": 10,
        "timestamp": t0,
        "predicted_label": "Deauth_Attack",
        "entity_ids": {
            "src_mac": "AA:11:22:33:44:55",
            "dst_mac": "11:22:33:44:55:66",
            "bssid": "AA:11:22:33:44:55",
            "ssid": "Guest_Lobby",
            "channel": 1
        }
    }
    event_ap2 = {
        "id": 11,
        "timestamp": t0 + timedelta(seconds=3.0),  # only 3 seconds later!
        "predicted_label": "Deauth_Attack",
        "entity_ids": {
            "src_mac": "BB:99:88:77:66:55",
            "dst_mac": "99:88:77:66:55:44",
            "bssid": "BB:99:88:77:66:55",
            "ssid": "Warehouse_Sensors",
            "channel": 11
        }
    }

    edge = evaluate_edge_candidate(event_ap1, event_ap2)
    # MUST BE NONE to prevent false correlation!
    assert edge is None


def test_graph_builder_connected_components():
    t0 = datetime(2026, 10, 22, 10, 0, 0)
    events = [
        {
            "id": 1,
            "timestamp": t0,
            "predicted_label": "Deauth_Attack",
            "entity_ids": {"bssid": "00:11:22:33:44:55", "ssid": "WiFi_A", "channel": 6}
        },
        {
            "id": 2,
            "timestamp": t0 + timedelta(seconds=5.0),
            "predicted_label": "Deauth_Attack",
            "entity_ids": {"bssid": "00:11:22:33:44:55", "ssid": "WiFi_A", "channel": 6}
        },
        {
            "id": 3,
            "timestamp": t0 + timedelta(seconds=10.0),
            "predicted_label": "Rogue_AP",
            "entity_ids": {"bssid": "00:99:88:77:66:55", "ssid": "WiFi_A", "channel": 11}
        }
    ]

    incidents, edges = build_incident_graph(events)
    assert len(incidents) >= 1
    # Check that incident contains all 3 linked events
    main_inc = incidents[0]
    assert len(main_inc["events"]) == 3
    assert main_inc["severity"] == "CRITICAL"
