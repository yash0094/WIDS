from typing import Optional, Dict, Any, List
from pydantic import BaseModel


class PerClassMetric(BaseModel):
    label: str
    precision: float
    recall: float
    f1_score: float
    support: int
    false_positive_rate: float


class ModelEvaluationMetrics(BaseModel):
    model_name: str
    model_version: str
    trained_at: str
    algorithm: str
    total_training_samples: int
    total_test_samples: int
    overall_accuracy: float
    macro_f1: float
    weighted_f1: float
    classes: List[str]
    per_class_metrics: List[PerClassMetric]
    confusion_matrix: List[List[int]]
    feature_importances: Dict[str, float]
    holdout_method: str
    leakage_prevention_notes: str


class ScenarioTestResult(BaseModel):
    scenario_id: str
    scenario_name: str
    description: str
    expected_behavior: str
    passed: bool
    grouping_correct: bool
    evidence_traceability_pct: float
    unsupported_claim_count: int
    notes: str


class EvaluationSummary(BaseModel):
    model_metrics: ModelEvaluationMetrics
    scenario_test_results: List[ScenarioTestResult]
    overall_system_score: float
    baseline_vs_proposed: Dict[str, Any]
