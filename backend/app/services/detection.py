import os
import joblib
import numpy as np
from typing import Dict, Any, List, Optional
from backend.app.services.preprocessing import FEATURE_COLUMNS, ATTACK_CLASSES, normalize_features, features_to_vector

_MODEL_CACHE = {}


def get_models():
    """
    Singleton loader for trained Random Forest and Isolation Forest models.
    """
    if "rf" not in _MODEL_CACHE:
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        rf_path = os.path.join(base_dir, "models", "baseline_rf.joblib")
        iso_path = os.path.join(base_dir, "models", "isolation_forest.joblib")

        if not os.path.exists(rf_path):
            raise FileNotFoundError(f"Model file not found at {rf_path}. Please run train_model.py first.")

        _MODEL_CACHE["rf"] = joblib.load(rf_path)
        _MODEL_CACHE["iso"] = joblib.load(iso_path) if os.path.exists(iso_path) else None

    return _MODEL_CACHE["rf"], _MODEL_CACHE["iso"]


def classify_features(features: Dict[str, Any]) -> Dict[str, Any]:
    """
    Runs inference on a single feature dictionary.
    Returns:
      predicted_label: str
      model_version: str
      scores: dict with class probabilities and anomaly metrics
    """
    rf, iso = get_models()
    x_vec = features_to_vector(features).reshape(1, -1)

    predicted_label = str(rf.predict(x_vec)[0])
    probs = rf.predict_proba(x_vec)[0]

    # Map probabilities to classes
    prob_dict = {str(c): round(float(p), 4) for c, p in zip(rf.classes_, probs)}
    confidence = float(np.max(probs))

    # Anomaly score from Isolation Forest (lower means more anomalous)
    anomaly_score = 0.0
    is_anomaly = False
    if iso is not None:
        raw_anomaly = float(iso.decision_function(x_vec)[0])
        anomaly_score = round(raw_anomaly, 4)
        is_anomaly = bool(iso.predict(x_vec)[0] == -1)

    return {
        "model_version": "rf-awid-v1.0",
        "predicted_label": predicted_label,
        "score_json": {
            "confidence": round(confidence, 4),
            "class_probabilities": prob_dict,
            "anomaly_score": anomaly_score,
            "is_anomaly": is_anomaly,
            "confidence_disclaimer": "Model confidence is an RF leaf vote ratio, not proof of causation."
        }
    }


def batch_classify(feature_matrix: np.ndarray) -> List[Dict[str, Any]]:
    """
    Efficient vectorised batch inference for ingested datasets.
    """
    rf, iso = get_models()
    preds = rf.predict(feature_matrix)
    probs = rf.predict_proba(feature_matrix)

    iso_scores = [0.0] * len(feature_matrix)
    iso_preds = [False] * len(feature_matrix)
    if iso is not None:
        iso_scores = [round(float(s), 4) for s in iso.decision_function(feature_matrix)]
        iso_preds = [bool(p == -1) for p in iso.predict(feature_matrix)]

    results = []
    classes = [str(c) for c in rf.classes_]

    for i in range(len(feature_matrix)):
        p_row = probs[i]
        prob_dict = {classes[j]: round(float(p_row[j]), 4) for j in range(len(classes))}
        results.append({
            "model_version": "rf-awid-v1.0",
            "predicted_label": str(preds[i]),
            "score_json": {
                "confidence": round(float(np.max(p_row)), 4),
                "class_probabilities": prob_dict,
                "anomaly_score": iso_scores[i],
                "is_anomaly": iso_preds[i],
                "confidence_disclaimer": "Model confidence is an RF leaf vote ratio, not proof of causation."
            }
        })
    return results
