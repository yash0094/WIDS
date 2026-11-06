export interface Capture {
  id: number;
  filename: string;
  source_type: string;
  start_time: string | null;
  end_time: string | null;
  checksum: string | null;
  record_count: number;
  status: string;
  imported_at: string;
}

export interface ShapContribution {
  feature: string;
  feature_value: number;
  shap_value: number;
  abs_impact: number;
  direction: 'positive' | 'negative';
  impact_label: string;
}

export interface ShapExplanation {
  base_value: number;
  target_class: string;
  feature_contributions: ShapContribution[];
  top_positive_features: ShapContribution[];
  top_negative_features: ShapContribution[];
  summary_text: string;
}

export interface Detection {
  id: number;
  event_id: number;
  model_version: string;
  predicted_label: string;
  score_json: {
    confidence: number;
    class_probabilities: Record<string, number>;
    anomaly_score: number;
    is_anomaly: boolean;
    confidence_disclaimer: string;
  };
  explanation_json: ShapExplanation;
  created_at: string;
}

export interface EventRecord {
  id: number;
  capture_id: number;
  timestamp: string;
  event_type: string;
  source_ref: string | null;
  entity_ids: {
    src_mac?: string;
    dst_mac?: string;
    bssid?: string;
    ssid?: string;
    channel?: number;
  };
  features_json: Record<string, number>;
  created_at: string;
  detection?: Detection;
}

export interface Edge {
  id: number;
  incident_id: number;
  from_event_id: number;
  to_event_id: number;
  relationship_type: string;
  reason: string;
  time_delta_seconds: number;
  rule_version: string;
  evidence_json: Record<string, any>;
}

export interface AnalystReview {
  id: number;
  incident_id: number;
  reviewer_decision: 'confirmed' | 'rejected' | 'needs_more_evidence';
  notes: string;
  reviewer_name: string;
  created_at: string;
}

export interface IncidentListItem {
  id: number;
  title: string;
  status: 'candidate' | 'under_investigation' | 'analyst_confirmed' | 'rejected' | 'needs_more_evidence';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  attack_type: string;
  primary_entity: string | null;
  start_time: string | null;
  end_time: string | null;
  event_count: number;
  created_at: string;
  updated_at: string;
  latest_review?: AnalystReview;
}

export interface NarrativeClaim {
  claim: string;
  supporting_event_ids: number[];
  confidence_level: 'Observed' | 'Model-predicted' | 'Correlated' | 'Hypothesis';
  evidence_note: string;
}

export interface Narrative {
  title: string;
  status: string;
  observed_facts: NarrativeClaim[];
  chronological_narrative: string;
  attack_hypothesis: string;
  alternative_explanations: string[];
  missing_evidence_and_unknowns: string[];
  recommended_investigation_steps: string[];
}

export interface IncidentDetail {
  id: number;
  title: string;
  status: string;
  severity: string;
  attack_type: string;
  primary_entity: string | null;
  start_time: string | null;
  end_time: string | null;
  created_at: string;
  updated_at: string;
  analyst_summary: string | null;
  events: EventRecord[];
  edges: Edge[];
  narrative: Narrative;
  reviews: AnalystReview[];
  cytoscape_elements: any[];
}

export interface PerClassMetric {
  label: string;
  precision: number;
  recall: number;
  f1_score: number;
  support: number;
  false_positive_rate: number;
}

export interface ModelMetrics {
  model_name: string;
  model_version: string;
  trained_at: string;
  algorithm: string;
  total_training_samples: number;
  total_test_samples: number;
  overall_accuracy: number;
  macro_f1: number;
  weighted_f1: number;
  classes: string[];
  per_class_metrics: PerClassMetric[];
  confusion_matrix: number[][];
  feature_importances: Record<string, number>;
  holdout_method: string;
  leakage_prevention_notes: string;
}

export interface ScenarioResult {
  scenario_id: string;
  scenario_name: string;
  description: string;
  expected_behavior: string;
  passed: boolean;
  grouping_correct: boolean;
  evidence_traceability_pct: number;
  unsupported_claim_count: number;
  notes: string;
}

export interface ReportItem {
  id: number;
  incident_id: number;
  generated_at: string;
  report_version: string;
  content_json: Record<string, any>;
}

export interface RadarBlip {
  id: string;
  angle: number;
  distance: number;
  label: string;
  bssid: string;
  channel: number;
  rssi: number;
  status: 'safe' | 'warning' | 'threat' | 'victim' | 'target';
  vendor?: string;
  type?: string;
}

export interface TelemetryLog {
  time_offset_ms: number;
  channel: number | string;
  level: 'info' | 'safe' | 'warn' | 'danger';
  message: string;
}

export interface ScanResult {
  scan_id: string;
  scan_mode?: 'real' | 'demo';
  demo_scenario?: string;
  scan_type?: string;
  status: string;
  threats_found: number;
  incident_id: number | null;
  incident_title: string;
  incident_severity: string;
  channels_scanned: number[];
  frames_analyzed: number;
  radar_blips: RadarBlip[];
  telemetry_stream: TelemetryLog[];
  summary: string;
  real_hardware?: {
    adapter?: string;
    mac?: string;
    ssid?: string;
    bssid?: string;
    channel?: number;
    band?: string;
    signal?: string;
  };
}

export interface PrivacyDevice {
  ip?: string;
  mac?: string;
  bssid?: string;
  ssid?: string;
  oui?: string;
  vendor?: string;
  risk_level: 'safe' | 'moderate' | 'high' | 'critical';
  risk_reasons: string[];
  open_ports?: number[];
  signal?: number;
  channel?: number;
  medium: string;
}

export interface PrivacySafetyTip {
  title: string;
  desc: string;
}

export interface PrivacyScanResult {
  status: string;
  verdict: 'AIRSPACE_SAFE' | 'CAMERAS_DETECTED' | 'SUSPICIOUS_IOT';
  summary: string;
  scanned_devices_count: number;
  cameras_found: number;
  suspicious_found: number;
  subnet_devices: PrivacyDevice[];
  airspace_camera_beacons: PrivacyDevice[];
  safety_tips: PrivacySafetyTip[];
  elapsed_ms: number;
  timestamp: string;
}


