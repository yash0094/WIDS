from datetime import datetime
from typing import Dict, Any, List


def generate_structured_report(
    incident: Dict[str, Any],
    narrative: Dict[str, Any],
    events: List[Dict[str, Any]],
    edges: List[Dict[str, Any]],
    reviews: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Constructs a complete capstone incident report with evidence links, SHAP citations,
    alternative hypotheses, and audit trail.
    """
    now_str = datetime.utcnow().isoformat() + "Z"

    report_content = {
        "report_id": f"REP-INC-{incident['id']}-{int(datetime.utcnow().timestamp())}",
        "generated_at": now_str,
        "report_version": "1.0",
        "incident_overview": {
            "incident_id": incident["id"],
            "title": incident["title"],
            "status": incident["status"],
            "severity": incident["severity"],
            "attack_type": incident["attack_type"],
            "primary_entity": incident.get("primary_entity", "N/A"),
            "event_count": len(events),
            "edge_count": len(edges),
            "time_window": f"{incident.get('start_time')} to {incident.get('end_time')}"
        },
        "executive_summary": narrative["chronological_narrative"],
        "observed_facts_with_evidence": narrative["observed_facts"],
        "hypotheses_and_adversary_intent": {
            "primary_hypothesis": narrative["attack_hypothesis"],
            "alternative_benign_explanations": narrative["alternative_explanations"],
            "missing_evidence_and_unknowns": narrative["missing_evidence_and_unknowns"]
        },
        "event_timeline": [
            {
                "event_id": e["id"],
                "timestamp": str(e["timestamp"]),
                "event_type": e["event_type"],
                "predicted_label": e.get("detection", {}).get("predicted_label", "Unknown"),
                "confidence": e.get("detection", {}).get("score_json", {}).get("confidence", 0.0),
                "entities": e.get("entity_ids", {}),
                "shap_top_drivers": e.get("detection", {}).get("explanation_json", {}).get("top_positive_features", [])
            }
            for e in sorted(events, key=lambda x: x["timestamp"])
        ],
        "correlation_graph_edges": [
            {
                "from_event_id": edge["from_event_id"],
                "to_event_id": edge["to_event_id"],
                "relationship_type": edge["relationship_type"],
                "reason": edge["reason"],
                "time_delta_seconds": edge.get("time_delta_seconds", 0.0),
                "rule_version": edge.get("rule_version", "v1.0")
            }
            for edge in edges
        ],
        "investigation_recommendations": narrative["recommended_investigation_steps"],
        "analyst_audit_history": [
            {
                "decision": r.get("reviewer_decision"),
                "notes": r.get("notes"),
                "reviewer": r.get("reviewer_name"),
                "reviewed_at": str(r.get("created_at"))
            }
            for r in reviews
        ],
        "methodology_and_limitations": {
            "ml_limitation": "The baseline Random Forest classifier operates on statistical 802.11 features. High prediction confidence denotes classifier decision surface proximity, not empirical proof of malice.",
            "correlation_limitation": "Graph edges represent deterministic rule compliance over temporal and entity observables. Temporal co-occurrence does not establish causality.",
            "ethical_usage": "This investigation tool is designed for defensive wireless monitoring on authorized infrastructure only."
        }
    }

    return report_content
