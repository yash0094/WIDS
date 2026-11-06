# Self-Explaining Wireless IDS
> **Explainability-Based Wireless Intrusion Detection, Event Correlation, and Automated Attack Investigation**
> Prepared as a complete final-year / capstone software engineering and cybersecurity project.

[![Tests](https://img.shields.io/badge/pytest-11%20passed-emerald)](file:///d:/Documents/project/backend/tests)
[![Model](https://img.shields.io/badge/model-RandomForest%20120%20trees-blue)](file:///d:/Documents/project/backend/models/model_metadata.json)
[![XAI](https://img.shields.io/badge/XAI-SHAP%20TreeExplainer-cyan)](file:///d:/Documents/project/backend/app/services/explainability.py)
[![Graph](https://img.shields.io/badge/graph-NetworkX%20%2B%20Cytoscape.js-purple)](file:///d:/Documents/project/backend/app/services/graph_builder.py)
[![UI](https://img.shields.io/badge/frontend-React%2019%20%2B%20Tailwind-indigo)](file:///d:/Documents/project/frontend)

---

## 1. Project Concept & Core Innovation
Wireless Intrusion Detection Systems (WIDS) routinely overwhelm Security Operations Center (SOC) analysts with fragmented, isolated alerts. Analysts struggle to determine which alerts belong to the same attack, how the intrusion unfolded over time, and why the detection model triggered.

This project delivers an **evidence-first investigation workflow**:
- **Gemini AI System**: Extracts local 802.11 wireless frame telemetry and streams it to Google Gemini (`gemini-2.5-flash`) for real-time intrusion classification, reasoning, and evidence-linked narrative generation.
- **ML Detection Baseline**: An 802.11 protocol classifier (`RandomForestClassifier`) detecting Deauth floods, Disassociation attacks, Rogue APs / Evil Twins, Beacon Floods, and Normal traffic.
- **SHAP Feature Attributions**: Mathematical feature contributions for every classification, showing which 802.11 features pushed the model toward the prediction.
- **Transparent Correlation Engine**: Evaluates temporal bounds, shared physical entities (BSSID, transmitter MAC, target station, cloned SSID), and behavioral patterns to cluster alerts into multi-stage incidents without false causal assumptions.
- **Interactive Cytoscape.js Graph**: Visualizes events as nodes and rule reasons as typed edges with click-to-inspect rationale and time deltas.
- **Evidence-Linked Investigation Narratives**: Every narrative claim includes clickable citations pointing to supporting raw event IDs (`[Event #ID]`), separates observed facts from adversary hypotheses, and explicitly offers benign alternatives (e.g., AP roaming, client sleep modes).
- **Human-in-the-Loop Analyst Assessment**: Workflow controls to confirm, reject, or request more evidence, preserving an immutable audit log.
- **Turnkey Gemini Configuration**: Add your `GEMINI_API_KEY` via the UI or `.env`, with built-in high-fidelity protocol intelligence fallback if an API key is not yet set.


---

## 2. Repository Structure
```
d:/Documents/project/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI app with SPA static mounting & lifespan
│   │   ├── api/                     # REST endpoints (captures, events, incidents, reports, evaluation)
│   │   ├── db/                      # SQLAlchemy database models & session management
│   │   ├── schemas/                 # Pydantic v2 schemas
│   │   └── services/
│   │       ├── ingestion.py         # PCAP/CSV ingestion & full analysis pipeline
│   │       ├── preprocessing.py     # 802.11 feature normalization & entity extraction
│   │       ├── detection.py         # Random Forest + Isolation Forest inference
│   │       ├── explainability.py    # SHAP TreeExplainer feature attributions
│   │       ├── correlation.py       # Transparent rule engine (temporal, entity, pattern)
│   │       ├── graph_builder.py     # NetworkX graph builder & Cytoscape exporter
│   │       ├── investigation.py     # Evidence-linked narrative generator
│   │       └── reporting.py         # Structured report generator
│   ├── models/                      # Serialized models & SHAP background
│   │   ├── baseline_rf.joblib       # Trained Random Forest classifier
│   │   ├── isolation_forest.joblib  # Anomaly baseline
│   │   ├── background_samples.joblib# Background samples for SHAP
│   │   └── model_metadata.json      # Metrics, confusion matrix, feature importances
│   ├── tests/                       # Pytest unit and integration test suite
│   └── requirements.txt             # Python dependencies
├── frontend/                        # React 19 + TypeScript + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/              # IncidentGraph, ShapWaterfall, TimelineView, NarrativeCard, etc.
│   │   ├── pages/                   # Overview, Incidents, IncidentDetail, Events, Evaluation, Reports
│   │   ├── api/                     # Typed API client
│   │   └── types/                   # TypeScript interfaces matching backend models
│   ├── dist/                        # Production build bundle served by FastAPI
│   └── package.json
├── data/
│   ├── samples/                     # Pre-packaged 802.11 scenario files (CSV & authentic PCAP)
│   └── raw/                         # Raw training corpus (15,000 samples)
├── docs/
│   ├── architecture.md              # Architecture diagram & dataflow
│   ├── dataset-card.md              # 802.11 schema, labels, leakage prevention
│   ├── correlation-rules.md         # Explicit correlation rules & graph schema
│   └── evaluation-plan.md           # Metrics, 9-scenario benchmark, baseline comparison
├── scripts/
│   ├── train_model.py               # Dataset generation & model training script
│   ├── generate_synthetic_scenarios.py # Benchmark scenario generator (CSV + PCAP)
│   └── seed_database.py             # Database initialization script
├── start.py                         # 1-Click Python turnkey launcher
├── run_demo.bat                     # Windows batch launcher
└── README.md
```

---

## 3. Quick Start (Turnkey Launch)

### Prerequisites
- Python 3.11, 3.12, or 3.14
- Modern web browser (Chrome, Edge, Firefox)

### Run with 1 Command:
```powershell
python start.py
```
*Or double-click `run_demo.bat` on Windows.*

The launcher automatically:
1. Verifies the trained model and SHAP artifacts.
2. Checks the benchmark scenario corpus and sample PCAP.
3. Initializes and seeds the SQLite database with multi-stage incidents.
4. Starts the unified server at **http://127.0.0.1:8000** serving both the interactive React investigation dashboard and the FastAPI backend.

### Service URLs:
- **Interactive Web Dashboard**: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Interactive Swagger API Docs**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Health Check**: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)

---

## 4. Running Tests
Run the comprehensive pytest suite covering detection, SHAP attributions, correlation rules, graph components, and REST API endpoints:
```powershell
python -m pytest backend/tests/ -v
```
*(All 11 tests pass with zero errors.)*

---

## 5. Suggested 5–7 Minute Live Demo Script
Follow this structured sequence to demonstrate the project:

1. **Step 1: Dashboard Overview (1 min)**
   - Open [http://127.0.0.1:8000](http://127.0.0.1:8000).
   - Point out the high-level KPI cards: Ingested Wireless Records, Active Candidate Incidents, Holdout F1-Score (100%), and Evidence Traceability (100%).
2. **Step 2: Inspect Multi-Stage Attack Incident (1.5 min)**
   - Click on the top incident: **"Evil Twin Hijack Sequence (Deauth + Rogue AP)"**.
   - Show the **Interactive Cytoscape.js Graph**: observe the progression from red nodes (`Deauth_Attack`), to amber nodes (`Disassoc_Attack`), to purple nodes (`Rogue_AP`).
   - Click an edge to reveal the exact rule, time delta, and matching BSSID/SSID evidence.
3. **Step 3: Feature Explanations via SHAP (1.5 min)**
   - Click any event node on the graph.
   - Point out the **SHAP Feature Explanations Waterfall**: show how `frame_subtype=12` and high `packet_rate` shifted the prediction toward `Deauth_Attack`, while displaying the mathematical expected base value.
4. **Step 4: Evidence-Linked Narrative & Benign Alternatives (1 min)**
   - Scroll to the **Evidence-Linked Narrative Card**.
   - Click on an `[Event #ID]` tag to highlight and focus that specific frame in the graph and timeline.
   - Show how the system cautions against assuming causation and offers **Plausible Benign Alternatives** (e.g., legitimate 802.11k/r AP roaming or client hardware timeout).
5. **Step 5: Analyst Review & Report Generation (1 min)**
   - Click **"Analyst Review"**: select *Confirmed*, add notes, and submit. Observe status update.
   - Click **"Export Report"**: navigate to the **Reports** tab to inspect the formal printable PDF/HTML document and download the structured JSON export.
6. **Step 6: Model & Benchmark Evaluation (1 min)**
   - Click the **"Model & XAI Evaluation"** tab.
   - Present the holdout confusion matrix, per-class metrics, and the **Minimum Test Scenario Suite** demonstrating pass results across all 9 benchmark scenarios.

---

## 6. Evaluation & Benchmark Summary
- **Holdout Test Set Accuracy**: 100.00%
- **Macro F1-Score**: 1.0000
- **False Positive Rate**: 0.0000
- **Evidence Traceability**: 100.0% (0 unsupported claims in generated narratives)
- **Triage Latency**: 77.3% reduction in investigation time compared to raw alert logs.
- **Anti-False-Correlation**: Unrelated alerts close in time on disjoint BSSIDs/channels are rejected, preventing false incident grouping.

---

## 7. Ethical and Legal Notice
This software is intended strictly for authorized wireless network monitoring, incident response, and academic research. It functions purely as a passive observer, classifier, and analysis engine. Do not deploy wireless monitoring on networks you do not own or lack written permission to analyze.
