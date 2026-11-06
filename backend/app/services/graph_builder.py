import networkx as nx
from typing import Dict, Any, List, Tuple
from backend.app.services.correlation import evaluate_edge_candidate


def build_incident_graph(events: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Constructs a clean NetworkX graph from a list of security events.
    Uses sequential and stage-transitional linking instead of an all-to-all dense mesh,
    producing an interpretable, clean attack progression DAG.
    """
    # Sort events chronologically
    sorted_events = sorted(events, key=lambda x: x["timestamp"])

    G = nx.Graph()

    attack_events = {}
    for ev in sorted_events:
        label = ev.get("detection", {}).get("predicted_label", ev.get("predicted_label", "Normal"))
        if label != "Normal":
            G.add_node(ev["id"], **ev)
            attack_events[ev["id"]] = ev

    attack_list = [attack_events[nid] for nid in sorted(attack_events.keys(), key=lambda x: attack_events[x]["timestamp"])]
    all_edges = []

    # 1. Sequential and Phase-Transition Edge Linking
    # Rather than linking every pair i < j (which causes K_n clutter of 28+ edges),
    # link each event to:
    # (a) The immediately preceding event if they share entity or pattern
    # (b) The most recent event of the prior attack phase if this is a phase change
    for i in range(1, len(attack_list)):
        curr_ev = attack_list[i]
        curr_label = curr_ev.get("detection", {}).get("predicted_label", curr_ev.get("predicted_label", "Unknown"))

        # Look back up to 3 prior events to find direct chain or phase transition
        linked = False
        for k in range(i - 1, max(-1, i - 4), -1):
            prev_ev = attack_list[k]
            prev_label = prev_ev.get("detection", {}).get("predicted_label", prev_ev.get("predicted_label", "Unknown"))

            edge = evaluate_edge_candidate(prev_ev, curr_ev)
            if edge:
                G.add_edge(prev_ev["id"], curr_ev["id"], **edge)
                all_edges.append(edge)
                linked = True
                # If this is the immediate predecessor, stop to avoid redundant cross-links
                if k == i - 1:
                    break

    # Find connected components (candidate incidents)
    candidate_incidents = []

    for comp in nx.connected_components(G):
        comp_events = [attack_events[nid] for nid in sorted(comp, key=lambda x: attack_events[x]["timestamp"])]
        if not comp_events:
            continue

        comp_ids = set(comp)
        comp_edges = [e for e in all_edges if e["from_event_id"] in comp_ids and e["to_event_id"] in comp_ids]

        # Determine primary attack type, entity, and severity
        attack_types = set(
            e.get("detection", {}).get("predicted_label", e.get("predicted_label", "Unknown"))
            for e in comp_events
        )

        if "Deauth_Attack" in attack_types and "Rogue_AP" in attack_types:
            incident_title = "Evil Twin Hijack Sequence (Deauth + Rogue AP)"
            attack_category = "Multi-Stage Hijack"
            severity = "CRITICAL"
        elif "Deauth_Attack" in attack_types and len(comp_events) > 1:
            incident_title = f"Distributed Deauthentication Flood ({len(comp_events)} alerts)"
            attack_category = "Deauth_Attack"
            severity = "HIGH"
        elif "Rogue_AP" in attack_types:
            incident_title = f"Rogue Access Point Presence ({len(comp_events)} detections)"
            attack_category = "Rogue_AP"
            severity = "HIGH"
        elif "Beacon_Flood" in attack_types:
            incident_title = f"802.11 Beacon Frame Flooding ({len(comp_events)} alerts)"
            attack_category = "Beacon_Flood"
            severity = "HIGH"
        elif len(comp_events) == 1:
            first_label = list(attack_types)[0]
            incident_title = f"Isolated Suspicious Event: {first_label} [ID #{comp_events[0]['id']}]"
            attack_category = first_label
            severity = "MEDIUM"
        else:
            incident_title = f"Correlated Wireless Incident ({', '.join(attack_types)})"
            attack_category = list(attack_types)[0]
            severity = "MEDIUM"

        first_ent = comp_events[0].get("entity_ids", {})
        primary_entity = first_ent.get("bssid") or first_ent.get("ssid") or first_ent.get("src_mac") or "Unknown"

        candidate_incidents.append({
            "title": incident_title,
            "status": "candidate",
            "severity": severity,
            "attack_type": attack_category,
            "primary_entity": primary_entity,
            "start_time": comp_events[0]["timestamp"],
            "end_time": comp_events[-1]["timestamp"],
            "events": comp_events,
            "edges": comp_edges
        })

    sev_rank = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
    candidate_incidents.sort(key=lambda x: (sev_rank.get(x["severity"], 4), x["start_time"]), reverse=False)

    return candidate_incidents, all_edges


def format_cytoscape_elements(events: List[Dict[str, Any]], edges: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Transforms events and correlation edges into clean Cytoscape.js format.
    Ensures concise labels and clean spacing.
    """
    elements = []

    for idx, ev in enumerate(events):
        eid = str(ev["id"])
        det = ev.get("detection", {})
        label = det.get("predicted_label", ev.get("predicted_label", "Event"))
        entities = ev.get("entity_ids", {})
        time_str = ev["timestamp"]
        if hasattr(time_str, "strftime"):
            time_str = time_str.strftime("%H:%M:%S")
        elif isinstance(time_str, str) and len(time_str) >= 19:
            time_str = time_str[11:19]

        # Short clean label for graph canvas to prevent text overlap
        short_label = label.replace("_Attack", "").replace("_AP", " AP")

        elements.append({
            "data": {
                "id": f"node-{eid}",
                "event_id": ev["id"],
                "label": f"#{eid} {short_label}",
                "event_type": label,
                "timestamp": str(time_str),
                "src_mac": entities.get("src_mac", "-"),
                "dst_mac": entities.get("dst_mac", "-"),
                "bssid": entities.get("bssid", "-"),
                "ssid": entities.get("ssid", "-"),
                "channel": entities.get("channel", "-"),
                "confidence": det.get("score_json", {}).get("confidence", 0.95),
            }
        })

    for edge in edges:
        from_id = f"node-{edge['from_event_id']}"
        to_id = f"node-{edge['to_event_id']}"
        edge_id = f"edge-{edge['from_event_id']}-{edge['to_event_id']}"
        delta_sec = edge.get('time_delta_seconds', 0)

        elements.append({
            "data": {
                "id": edge_id,
                "source": from_id,
                "target": to_id,
                "relationship_type": edge.get("relationship_type", "shared_entity"),
                "label": f"+{delta_sec}s",
                "reason": edge.get("reason", "Correlated event progression"),
                "time_delta": delta_sec
            }
        })

    return elements
