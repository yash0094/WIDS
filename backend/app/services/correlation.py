from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple

CORRELATION_RULES_VERSION = "v1.2-wireless-transparent"

# Configurable correlation parameters
DEFAULT_MAX_WINDOW_SECONDS = 90.0  # Events older than this won't be linked
STRICT_ENTITY_MATCH_REQUIRED = True

BEHAVIORAL_PATTERNS = {
    # If Event A is followed by Event B, check if it's a known attack progression pattern
    ("Deauth_Attack", "Disassoc_Attack"): {
        "pattern": "Forced Disconnection Phase",
        "description": "Attacker cycling between Deauthentication and Disassociation frames to break client connectivity."
    },
    ("Deauth_Attack", "Rogue_AP"): {
        "pattern": "Deauth-to-EvilTwin Hijack",
        "description": "Deauthentication burst followed by Rogue AP beaconing on matched SSID/Channel to force client association."
    },
    ("Disassoc_Attack", "Rogue_AP"): {
        "pattern": "Disassoc-to-EvilTwin Hijack",
        "description": "Disassociation burst followed by Rogue AP beaconing on matched SSID to trick victim into connecting."
    },
    ("Beacon_Flood", "Deauth_Attack"): {
        "pattern": "Denial of Service Cascade",
        "description": "Massive beacon flooding saturating the channel coupled with targeted deauth disconnects."
    },
    ("Deauth_Attack", "Deauth_Attack"): {
        "pattern": "Sustained Deauth Campaign",
        "description": "Repeated targeted deauth bursts over consecutive intervals."
    },
    ("Beacon_Flood", "Beacon_Flood"): {
        "pattern": "Sustained Beacon Exhaustion",
        "description": "Continuous SSID injection flooding AP beacon table."
    },
    ("Rogue_AP", "Rogue_AP"): {
        "pattern": "Persistent Rogue AP Presence",
        "description": "Repeated rogue beacon activity from identical anomalous BSSID."
    }
}


def evaluate_edge_candidate(
    event_a: Dict[str, Any],
    event_b: Dict[str, Any],
    max_window_sec: float = DEFAULT_MAX_WINDOW_SECONDS
) -> Optional[Dict[str, Any]]:
    """
    Evaluates whether two events should be connected by an edge.
    Adheres strictly to the guide rules:
    - Does NOT link solely because timestamps are close!
    - Requires either shared observable entity or confirmed behavioral sequence on the same wireless context.
    - Captures the exact reason, time interval, rule version, and evidence.
    """
    # Ensure event_a is earlier than or equal to event_b in time
    time_a = event_a["timestamp"]
    time_b = event_b["timestamp"]
    if isinstance(time_a, str):
        time_a = datetime.fromisoformat(time_a.replace("Z", "+00:00"))
    if isinstance(time_b, str):
        time_b = datetime.fromisoformat(time_b.replace("Z", "+00:00"))

    delta_sec = abs((time_b - time_a).total_seconds())

    # 1. Rule Check: Temporal Window
    if delta_sec > max_window_sec:
        return None  # Exceeds max correlation window

    entities_a = event_a.get("entity_ids", {})
    entities_b = event_b.get("entity_ids", {})

    src_a, src_b = entities_a.get("src_mac", "").lower(), entities_b.get("src_mac", "").lower()
    dst_a, dst_b = entities_a.get("dst_mac", "").lower(), entities_b.get("dst_mac", "").lower()
    bssid_a, bssid_b = entities_a.get("bssid", "").lower(), entities_b.get("bssid", "").lower()
    ssid_a, ssid_b = str(entities_a.get("ssid", "")), str(entities_b.get("ssid", ""))
    chan_a, chan_b = entities_a.get("channel"), entities_b.get("channel")

    label_a = event_a.get("detection", {}).get("predicted_label", event_a.get("predicted_label", "Unknown"))
    label_b = event_b.get("detection", {}).get("predicted_label", event_b.get("predicted_label", "Unknown"))

    # If either event is Normal, do not link to attack incidents unless benign alternative context
    if label_a == "Normal" or label_b == "Normal":
        return None

    shared_identifiers = []
    # Check meaningful entity overlaps (excluding broadcast ff:ff:ff:ff:ff:ff and zero addresses)
    if bssid_a and bssid_b and bssid_a == bssid_b and bssid_a not in ("ff:ff:ff:ff:ff:ff", "00:00:00:00:00:00"):
        shared_identifiers.append(f"Same BSSID ({bssid_a})")

    if src_a and src_b and src_a == src_b and src_a not in ("ff:ff:ff:ff:ff:ff", "00:00:00:00:00:00"):
        shared_identifiers.append(f"Same Source MAC ({src_a})")

    if dst_a and dst_b and dst_a == dst_b and dst_a not in ("ff:ff:ff:ff:ff:ff", "00:00:00:00:00:00"):
        shared_identifiers.append(f"Same Target Client ({dst_a})")

    if ssid_a and ssid_b and ssid_a == ssid_b and ssid_a not in ("Unknown_SSID", "", "None"):
        shared_identifiers.append(f"Matching SSID ('{ssid_a}')")

    # Anti-leakage / Anti-false-link rule:
    # If there are NO shared identifiers and NO channel match, DO NOT link simply due to timing.
    if not shared_identifiers:
        # Check if there is an Evil Twin spoofing pattern (same SSID on different channel or BSSID)
        if ssid_a and ssid_b and ssid_a.lower() == ssid_b.lower() and ssid_a not in ("Unknown_SSID", ""):
            shared_identifiers.append(f"SSID Match on Different BSSID/Channel ('{ssid_a}')")
        elif label_a == "Beacon_Flood" and label_b == "Beacon_Flood" and chan_a and chan_a == chan_b:
            shared_identifiers.append(f"Same-Channel Beacon Flood Campaign (Channel {chan_a})")
        else:
            return None  # Unrelated alerts close in time must remain separate!

    # 2. Rule Check: Behavioral Compatibility
    pattern_key = (label_a, label_b)
    pattern_info = BEHAVIORAL_PATTERNS.get(pattern_key)

    rel_type = "shared_entity"
    reason_parts = [
        f"Temporal delta {delta_sec:.1f}s within {max_window_sec}s threshold.",
        f"Shared entities: {', '.join(shared_identifiers)}."
    ]

    if pattern_info:
        rel_type = "pattern_match"
        reason_parts.append(f"Pattern detected: [{pattern_info['pattern']}] - {pattern_info['description']}")
    else:
        reason_parts.append(f"Observed simultaneous attack vectors ({label_a} & {label_b}) on shared wireless entity.")

    reason = " ".join(reason_parts)

    return {
        "from_event_id": event_a["id"],
        "to_event_id": event_b["id"],
        "relationship_type": rel_type,
        "reason": reason,
        "time_delta_seconds": round(delta_sec, 2),
        "rule_version": CORRELATION_RULES_VERSION,
        "evidence_json": {
            "shared_identifiers": shared_identifiers,
            "delta_seconds": round(delta_sec, 2),
            "source_event_type": label_a,
            "target_event_type": label_b,
            "channel_a": chan_a,
            "channel_b": chan_b
        }
    }
