import pytest
import numpy as np
from backend.app.services.preprocessing import normalize_features, features_to_vector, FEATURE_COLUMNS
from backend.app.services.detection import classify_features, get_models
from backend.app.services.explainability import explain_prediction


def test_preprocessing_normalization():
    raw = {
        "frame_length": "128",
        "frame_type": "0",
        "frame_subtype": 12,
        "packet_rate": 180.5,
        "delta_time": 0.005,
        "is_broadcast": 0,
        "channel": 6
    }
    clean = normalize_features(raw)
    assert isinstance(clean["frame_length"], float)
    assert clean["frame_subtype"] == 12.0
    assert clean["packet_rate"] == 180.5
    # Default fallback check
    assert clean["signal_dbm"] == -65.0

    vec = features_to_vector(clean)
    assert isinstance(vec, np.ndarray)
    assert len(vec) == len(FEATURE_COLUMNS)


def test_detection_classification():
    # Construct a classic Deauthentication burst signature
    deauth_features = {
        "frame_length": 44.0,
        "frame_type": 0,
        "frame_subtype": 12,
        "retry_flag": 0,
        "seq_num": 250,
        "signal_dbm": -45.0,
        "packet_rate": 200.0,
        "delta_time": 0.005,
        "auth_code": 7,
        "is_broadcast": 0,
        "channel": 6,
        "payload_entropy": 2.2
    }
    result = classify_features(deauth_features)
    assert result["predicted_label"] == "Deauth_Attack"
    assert result["score_json"]["confidence"] > 0.8
    assert "class_probabilities" in result["score_json"]


def test_shap_explanation_generation():
    deauth_features = {
        "frame_length": 44.0,
        "frame_type": 0,
        "frame_subtype": 12,
        "retry_flag": 0,
        "seq_num": 250,
        "signal_dbm": -45.0,
        "packet_rate": 200.0,
        "delta_time": 0.005,
        "auth_code": 7,
        "is_broadcast": 0,
        "channel": 6,
        "payload_entropy": 2.2
    }
    explanation = explain_prediction(deauth_features, "Deauth_Attack")
    assert explanation["target_class"] == "Deauth_Attack"
    assert len(explanation["feature_contributions"]) == len(FEATURE_COLUMNS)
    assert len(explanation["top_positive_features"]) > 0
    # Packet rate or subtype should be among positive drivers
    pos_feat_names = [f["feature"] for f in explanation["top_positive_features"]]
    assert any(f in pos_feat_names for f in ["frame_subtype", "packet_rate", "delta_time", "frame_type"])
