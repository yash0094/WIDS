import os
import hashlib
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
import pandas as pd
from sqlalchemy.orm import Session

from backend.app.db.models import Capture, Event, Detection, Incident, IncidentEvent, EventEdge
from backend.app.services.preprocessing import dataframe_to_feature_matrix, normalize_features
from backend.app.services.detection import batch_classify
from backend.app.services.explainability import explain_prediction
from backend.app.services.graph_builder import build_incident_graph


def compute_file_checksum(filepath: str) -> str:
    hasher = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            hasher.update(chunk)
    return hasher.hexdigest()


def parse_pcap_file(filepath: str) -> pd.DataFrame:
    """
    Parses an 802.11 PCAP file using Scapy. Extracts Dot11 frame features.
    """
    from scapy.all import rdpcap
    from scapy.layers.dot11 import Dot11, Dot11Beacon, Dot11Deauth, Dot11Disas, RadioTap

    packets = rdpcap(filepath)
    rows = []
    base_time = datetime.utcnow()
    last_pkt_time = None

    for idx, pkt in enumerate(packets):
        pkt_time = base_time + timedelta(seconds=float(pkt.time)) if hasattr(pkt, "time") else base_time + timedelta(seconds=idx * 0.1)
        delta_sec = (pkt_time - last_pkt_time).total_seconds() if last_pkt_time else 0.05
        last_pkt_time = pkt_time

        length = len(pkt)
        signal_dbm = -65.0
        if pkt.haslayer(RadioTap):
            rt = pkt.getlayer(RadioTap)
            if hasattr(rt, "dBm_AntSignal"):
                signal_dbm = float(rt.dBm_AntSignal)

        if pkt.haslayer(Dot11):
            d11 = pkt.getlayer(Dot11)
            ftype = int(d11.type)
            fsubtype = int(d11.subtype)
            retry = int(bool(d11.FCfield & 0x08))
            seq = int(d11.SC >> 4) if hasattr(d11, "SC") else 0
            src_mac = str(d11.addr2) if d11.addr2 else "00:00:00:00:00:00"
            dst_mac = str(d11.addr1) if d11.addr1 else "ff:ff:ff:ff:ff:ff"
            bssid = str(d11.addr3) if d11.addr3 else "00:00:00:00:00:00"
            is_bcast = 1 if dst_mac.lower() == "ff:ff:ff:ff:ff:ff" else 0
            ssid = "Unknown_SSID"
            auth_code = 0

            if pkt.haslayer(Dot11Beacon):
                beacon = pkt.getlayer(Dot11Beacon)
                ssid_bytes = getattr(beacon, "info", b"")
                ssid = ssid_bytes.decode("utf-8", errors="ignore") if isinstance(ssid_bytes, bytes) else str(ssid_bytes)

            if pkt.haslayer(Dot11Deauth):
                deauth = pkt.getlayer(Dot11Deauth)
                auth_code = int(getattr(deauth, "reason", 1))

            if pkt.haslayer(Dot11Disas):
                disas = pkt.getlayer(Dot11Disas)
                auth_code = int(getattr(disas, "reason", 8))

            rows.append({
                "timestamp": pkt_time.isoformat(),
                "source_ref": f"pcap_packet_#{idx + 1}",
                "frame_length": length,
                "frame_type": ftype,
                "frame_subtype": fsubtype,
                "retry_flag": retry,
                "seq_num": seq,
                "signal_dbm": signal_dbm,
                "packet_rate": round(1.0 / max(delta_sec, 0.001), 1),
                "delta_time": round(delta_sec, 4),
                "auth_code": auth_code,
                "is_broadcast": is_bcast,
                "channel": 6,
                "payload_entropy": 3.8,
                "src_mac": src_mac,
                "dst_mac": dst_mac,
                "bssid": bssid,
                "ssid": ssid
            })

    if not rows:
        raise ValueError("No 802.11 Dot11 frames could be identified in the provided PCAP.")

    return pd.DataFrame(rows)


def ingest_file_pipeline(
    filepath: str,
    db: Session,
    source_type: str = "csv"
) -> Dict[str, Any]:
    """
    Full end-to-end processing pipeline:
    File -> Ingestion -> Preprocessing -> Detection -> SHAP Explanations -> Correlation -> Incidents -> DB
    """
    filename = os.path.basename(filepath)
    checksum = compute_file_checksum(filepath)

    # Load dataframe based on source type
    if source_type == "pcap" or filename.lower().endswith(".pcap"):
        df = parse_pcap_file(filepath)
        source_type = "pcap"
    else:
        df = pd.read_csv(filepath)
        source_type = "csv"

    # Ensure timestamp column
    if "timestamp" not in df.columns:
        now = datetime.utcnow()
        df["timestamp"] = [now + timedelta(seconds=i * 2) for i in range(len(df))]
    else:
        df["timestamp"] = pd.to_datetime(df["timestamp"], format="mixed")


    start_time = df["timestamp"].min()
    end_time = df["timestamp"].max()

    # 1. Create Capture Record
    capture = Capture(
        filename=filename,
        source_type=source_type,
        start_time=start_time.to_pydatetime() if hasattr(start_time, "to_pydatetime") else start_time,
        end_time=end_time.to_pydatetime() if hasattr(end_time, "to_pydatetime") else end_time,
        checksum=checksum,
        record_count=len(df),
        status="processing"
    )
    db.add(capture)
    db.commit()
    db.refresh(capture)

    # 2. Preprocess & Batch Detection
    X_matrix, entity_rows = dataframe_to_feature_matrix(df)
    detection_results = batch_classify(X_matrix)

    events_to_correlate = []
    created_events = []

    for idx, row in df.iterrows():
        t_val = row["timestamp"]
        dt_val = t_val.to_pydatetime() if hasattr(t_val, "to_pydatetime") else t_val
        clean_feat = normalize_features(row.to_dict())
        entities = entity_rows[idx]
        source_ref = str(row.get("source_ref", f"row_{idx + 1}"))

        det_info = detection_results[idx]
        pred_label = det_info["predicted_label"]

        # Determine event type name
        event_type = f"Dot11_{pred_label}"

        # 3. Create Event record
        event_obj = Event(
            capture_id=capture.id,
            timestamp=dt_val,
            event_type=event_type,
            source_ref=source_ref,
            entity_ids=entities,
            features_json=clean_feat
        )
        db.add(event_obj)
        db.flush()  # assign ID

        # 4. Generate SHAP Explanation
        explanation_data = explain_prediction(clean_feat, pred_label)

        # Create Detection record
        detection_obj = Detection(
            event_id=event_obj.id,
            model_version=det_info["model_version"],
            predicted_label=pred_label,
            score_json=det_info["score_json"],
            explanation_json=explanation_data
        )
        db.add(detection_obj)

        event_dict = {
            "id": event_obj.id,
            "capture_id": capture.id,
            "timestamp": dt_val,
            "event_type": event_type,
            "source_ref": source_ref,
            "entity_ids": entities,
            "features_json": clean_feat,
            "detection": {
                "predicted_label": pred_label,
                "score_json": det_info["score_json"],
                "explanation_json": explanation_data,
                "model_version": det_info["model_version"]
            }
        }
        events_to_correlate.append(event_dict)
        created_events.append(event_obj)

    # 5. Correlation & Incident Graph Construction
    candidate_incidents, all_edges = build_incident_graph(events_to_correlate)

    # 6. Persist Incidents and Edges to Database
    for inc_data in candidate_incidents:
        inc_obj = Incident(
            title=inc_data["title"],
            status="candidate",
            severity=inc_data["severity"],
            attack_type=inc_data["attack_type"],
            primary_entity=inc_data["primary_entity"],
            start_time=inc_data["start_time"],
            end_time=inc_data["end_time"],
            analyst_summary=None
        )
        db.add(inc_obj)
        db.flush()

        # Link Events to Incident
        for pos, ev_item in enumerate(inc_data["events"]):
            inc_event_link = IncidentEvent(
                incident_id=inc_obj.id,
                event_id=ev_item["id"],
                position=pos,
                inclusion_reason=f"Correlated as part of {inc_data['attack_type']} incident group"
            )
            db.add(inc_event_link)

        # Add Edges for this incident
        for e in inc_data["edges"]:
            edge_obj = EventEdge(
                incident_id=inc_obj.id,
                from_event_id=e["from_event_id"],
                to_event_id=e["to_event_id"],
                relationship_type=e["relationship_type"],
                reason=e["reason"],
                time_delta_seconds=e["time_delta_seconds"],
                rule_version=e["rule_version"],
                evidence_json=e["evidence_json"]
            )
            db.add(edge_obj)

    capture.status = "processed"
    db.commit()

    return {
        "capture_id": capture.id,
        "filename": filename,
        "total_records": len(df),
        "total_events": len(created_events),
        "total_incidents": len(candidate_incidents),
        "total_edges": len(all_edges)
    }
