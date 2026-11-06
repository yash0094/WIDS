import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship
from backend.app.db.database import Base


class Capture(Base):
    __tablename__ = "captures"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    filename = Column(String(255), nullable=False)
    source_type = Column(String(50), nullable=False, default="csv")  # csv, pcap, synthetic
    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)
    checksum = Column(String(64), nullable=True)
    record_count = Column(Integer, default=0)
    status = Column(String(50), default="processed")  # uploaded, processing, processed, error
    imported_at = Column(DateTime, default=datetime.datetime.utcnow)

    events = relationship("Event", back_populates="capture", cascade="all, delete-orphan")


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    capture_id = Column(Integer, ForeignKey("captures.id", ondelete="CASCADE"), nullable=False)
    timestamp = Column(DateTime, nullable=False, index=True)
    event_type = Column(String(100), nullable=False)  # e.g., Management_Deauth, Probe_Flood, etc.
    source_ref = Column(String(255), nullable=True)  # File row index or packet sequence number
    entity_ids = Column(JSON, nullable=False, default=dict)  # {"src_mac": ..., "dst_mac": ..., "bssid": ..., "ssid": ..., "channel": ...}
    features_json = Column(JSON, nullable=False, default=dict)  # Normalized 802.11 feature dictionary
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    capture = relationship("Capture", back_populates="events")
    detection = relationship("Detection", back_populates="event", uselist=False, cascade="all, delete-orphan")
    incident_associations = relationship("IncidentEvent", back_populates="event", cascade="all, delete-orphan")


class Detection(Base):
    __tablename__ = "detections"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), unique=True, nullable=False)
    model_version = Column(String(50), nullable=False)
    predicted_label = Column(String(100), nullable=False)  # Normal, Deauth_Attack, Disassoc_Attack, Rogue_AP, Beacon_Flood
    score_json = Column(JSON, nullable=False, default=dict)  # Probability breakdown & anomaly score
    explanation_json = Column(JSON, nullable=False, default=dict)  # SHAP values, base value, top features
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    event = relationship("Event", back_populates="detection")


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    status = Column(String(50), default="candidate")  # candidate, under_investigation, analyst_confirmed, rejected, needs_more_evidence
    severity = Column(String(20), default="MEDIUM")  # LOW, MEDIUM, HIGH, CRITICAL
    attack_type = Column(String(100), nullable=False)
    primary_entity = Column(String(255), nullable=True)  # Primary suspect/target MAC or SSID
    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)
    analyst_summary = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    incident_events = relationship("IncidentEvent", back_populates="incident", cascade="all, delete-orphan")
    edges = relationship("EventEdge", back_populates="incident", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="incident", cascade="all, delete-orphan")
    reviews = relationship("AnalystReview", back_populates="incident", cascade="all, delete-orphan")


class IncidentEvent(Base):
    __tablename__ = "incident_events"

    incident_id = Column(Integer, ForeignKey("incidents.id", ondelete="CASCADE"), primary_key=True)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), primary_key=True)
    position = Column(Integer, default=0)
    inclusion_reason = Column(String(255), nullable=True)

    incident = relationship("Incident", back_populates="incident_events")
    event = relationship("Event", back_populates="incident_associations")


class EventEdge(Base):
    __tablename__ = "event_edges"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    incident_id = Column(Integer, ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False)
    from_event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    to_event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    relationship_type = Column(String(50), nullable=False)  # temporal, shared_entity, pattern_match, analyst_confirmed
    reason = Column(Text, nullable=False)
    time_delta_seconds = Column(Float, default=0.0)
    rule_version = Column(String(50), default="v1.0")
    evidence_json = Column(JSON, nullable=False, default=dict)

    incident = relationship("Incident", back_populates="edges")
    from_event = relationship("Event", foreign_keys=[from_event_id])
    to_event = relationship("Event", foreign_keys=[to_event_id])


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    incident_id = Column(Integer, ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False)
    generated_at = Column(DateTime, default=datetime.datetime.utcnow)
    report_version = Column(String(50), default="1.0")
    content_json = Column(JSON, nullable=False, default=dict)

    incident = relationship("Incident", back_populates="reports")


class AnalystReview(Base):
    __tablename__ = "analyst_reviews"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    incident_id = Column(Integer, ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False)
    reviewer_decision = Column(String(50), nullable=False)  # confirmed, rejected, needs_more_evidence
    notes = Column(Text, nullable=False)
    reviewer_name = Column(String(100), default="Security Analyst")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    incident = relationship("Incident", back_populates="reviews")
