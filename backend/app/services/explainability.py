import os
import joblib
import numpy as np
from typing import Dict, Any, List
import shap
from backend.app.services.preprocessing import FEATURE_COLUMNS, features_to_vector
from backend.app.services.detection import get_models

_EXPLAINER_CACHE = {}


def get_explainer():
    """
    Singleton TreeExplainer initialized with background training samples.
    """
    if "explainer" not in _EXPLAINER_CACHE:
        rf, _ = get_models()
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        bg_path = os.path.join(base_dir, "models", "background_samples.joblib")
        bg_samples = joblib.load(bg_path) if os.path.exists(bg_path) else None

        _EXPLAINER_CACHE["explainer"] = shap.TreeExplainer(rf, data=bg_samples)
        _EXPLAINER_CACHE["classes"] = list(rf.classes_)

    return _EXPLAINER_CACHE["explainer"], _EXPLAINER_CACHE["classes"]


def explain_prediction(features: Dict[str, Any], predicted_label: str) -> Dict[str, Any]:
    """
    Computes SHAP feature importance values for an event's predicted class.
    """
    explainer, classes = get_explainer()
    x_vec = features_to_vector(features).reshape(1, -1)

    # Calculate SHAP values
    shap_vals = explainer.shap_values(x_vec)

    # Determine class index
    class_idx = classes.index(predicted_label) if predicted_label in classes else 0

    # Extract SHAP array for this class:
    # SHAP TreeExplainer format can be:
    # - array of shape (n_samples, n_features, n_classes) or
    # - list of length n_classes where each element has shape (n_samples, n_features)
    if isinstance(shap_vals, list):
        class_shap = shap_vals[class_idx][0]
    elif len(shap_vals.shape) == 3:
        class_shap = shap_vals[0, :, class_idx]
    else:
        class_shap = shap_vals[0]

    # Base expected value
    base_val = 0.0
    if hasattr(explainer, "expected_value"):
        ev = explainer.expected_value
        if isinstance(ev, (list, np.ndarray)) and len(ev) > class_idx:
            base_val = float(ev[class_idx])
        elif isinstance(ev, (int, float, np.floating)):
            base_val = float(ev)

    contributions = []
    for col, sv in zip(FEATURE_COLUMNS, class_shap):
        fval = float(features.get(col, 0.0))
        sv_float = float(sv)
        contributions.append({
            "feature": col,
            "feature_value": round(fval, 3),
            "shap_value": round(sv_float, 4),
            "abs_impact": round(abs(sv_float), 4),
            "direction": "positive" if sv_float >= 0 else "negative",
            "impact_label": "Increases probability" if sv_float >= 0 else "Decreases probability"
        })

    # Sort by absolute impact
    contributions.sort(key=lambda x: x["abs_impact"], reverse=True)

    top_positive = [c for c in contributions if c["direction"] == "positive"][:3]
    top_negative = [c for c in contributions if c["direction"] == "negative"][:3]

    # Create faithful human-readable summary
    top_pos_names = [f"{c['feature']} ({c['feature_value']}, SHAP +{c['shap_value']})" for c in top_positive]
    summary_text = (
        f"Prediction '{predicted_label}' was primarily driven by: {', '.join(top_pos_names)}. "
        f"SHAP baseline expected value was {base_val:.3f}. Note: SHAP explains model internal scoring, not physical proof."
    )

    return {
        "base_value": round(base_val, 4),
        "target_class": predicted_label,
        "feature_contributions": contributions,
        "top_positive_features": top_positive,
        "top_negative_features": top_negative,
        "summary_text": summary_text
    }
