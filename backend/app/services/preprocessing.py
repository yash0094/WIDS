import numpy as np
import pandas as pd
from typing import Dict, Any, List, Tuple

# Canonical feature list expected by the ML model
FEATURE_COLUMNS = [
    "frame_length",
    "frame_type",
    "frame_subtype",
    "retry_flag",
    "seq_num",
    "signal_dbm",
    "packet_rate",
    "delta_time",
    "auth_code",
    "is_broadcast",
    "channel",
    "payload_entropy"
]

FEATURE_DEFAULTS = {
    "frame_length": 128.0,
    "frame_type": 0,
    "frame_subtype": 8,
    "retry_flag": 0,
    "seq_num": 100,
    "signal_dbm": -65.0,
    "packet_rate": 10.0,
    "delta_time": 0.1,
    "auth_code": 0,
    "is_broadcast": 0,
    "channel": 6,
    "payload_entropy": 3.5
}

ATTACK_CLASSES = [
    "Normal",
    "Deauth_Attack",
    "Disassoc_Attack",
    "Rogue_AP",
    "Beacon_Flood"
]


def normalize_features(raw_features: Dict[str, Any]) -> Dict[str, float]:
    """
    Ensures all canonical features are present and cast to standard floats/ints.
    Fills missing values with domain defaults.
    """
    clean = {}
    for col in FEATURE_COLUMNS:
        val = raw_features.get(col, FEATURE_DEFAULTS.get(col, 0.0))
        try:
            clean[col] = float(val) if val is not None and not pd.isna(val) else float(FEATURE_DEFAULTS[col])
        except (ValueError, TypeError):
            clean[col] = float(FEATURE_DEFAULTS[col])
    return clean


def features_to_vector(features: Dict[str, float]) -> np.ndarray:
    """
    Converts feature dictionary to ordered 1D numpy vector for scikit-learn.
    """
    clean = normalize_features(features)
    return np.array([clean[col] for col in FEATURE_COLUMNS], dtype=np.float32)


def dataframe_to_feature_matrix(df: pd.DataFrame) -> Tuple[np.ndarray, List[Dict[str, Any]]]:
    """
    Extracts ordered feature matrix and entity dictionaries from a Pandas DataFrame.
    """
    matrix_rows = []
    entity_rows = []

    for _, row in df.iterrows():
        raw_feat = row.to_dict()
        clean_feat = normalize_features(raw_feat)
        matrix_rows.append([clean_feat[c] for c in FEATURE_COLUMNS])

        # Extract observable entities
        entities = {
            "src_mac": str(row.get("src_mac", "00:00:00:00:00:00")),
            "dst_mac": str(row.get("dst_mac", "ff:ff:ff:ff:ff:ff")),
            "bssid": str(row.get("bssid", "00:00:00:00:00:00")),
            "ssid": str(row.get("ssid", "Unknown_SSID")),
            "channel": int(clean_feat["channel"])
        }
        entity_rows.append(entities)

    return np.array(matrix_rows, dtype=np.float32), entity_rows
