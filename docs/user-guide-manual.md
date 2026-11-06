# Wireless-IDS: Wi-Fi Threat Scanner & Explainable Airspace SecOps
## Comprehensive Project Documentation & User Guide Manual

---

## Table of Contents
1. [Executive Summary & Innovation](#1-executive-summary--innovation)
2. [System Architecture & 7-Stage Pipeline](#2-system-architecture--7-stage-pipeline)
3. [Technology Stack & Repository Layout](#3-technology-stack--repository-layout)
4. [Machine Learning & Explainable AI (XAI) Engine](#4-machine-learning--explainable-ai-xai-engine)
5. [Rule-Governed Event Correlation & Graph Builder](#5-rule-governed-event-correlation--graph-builder)
6. [Camera Guard: Hidden Camera & Women's Privacy Scanner](#6-camera-guard-hidden-camera--womens-privacy-scanner)
7. [Installation & Turnkey Setup](#7-installation--turnkey-setup)
8. [Step-by-Step User Guide Manual](#8-step-by-step-user-guide-manual)
   - 8.1 [Wi-Fi Threat Dashboard (Overview)](#81-wi-fi-threat-dashboard-overview)
   - 8.2 [Live Wi-Fi Threat Scanner (Radar Modal)](#82-live-wi-fi-threat-scanner-radar-modal)
   - 8.3 [Camera Guard (Hidden Camera & Privacy Scanner)](#83-camera-guard-hidden-camera--privacy-scanner)
   - 8.4 [Incidents & Candidate Correlation Graph](#84-incidents--candidate-correlation-graph)
   - 8.5 [Incident Detail Cockpit & SHAP Waterfall](#85-incident-detail-cockpit--shap-waterfall)
   - 8.6 [PCAP Event Log & Frame Telemetry](#86-pcap-event-log--frame-telemetry)
   - 8.7 [Model & XAI Evaluation Benchmarks](#87-model--xai-evaluation-benchmarks)
   - 8.8 [Forensic Incident Reporting](#88-forensic-incident-reporting)
   - 8.9 [Google Gemini 2.5 Flash Setup](#89-google-gemini-25-flash-setup)
9. [Physical Testing & Attacker Simulation Guide](#9-physical-testing--attacker-simulation-guide)
10. [Troubleshooting & FAQ](#10-troubleshooting--faq)

---

## 1. Executive Summary & Innovation

Traditional Wireless Intrusion Detection Systems (WIDS) emit floods of isolated, uncontextualized alerts. Security Operations Center (SOC) analysts face alert fatigue, lack clarity on which alerts form an orchestrated attack chain, and struggle to explain to stakeholders why an AI model flagged a frame as malicious.

**Wireless-IDS** solves this with an **Evidence-First, Explainability-Centered Architecture**:
- **802.11 Protocol Random Forest Classifier**: High-speed, frame-level classification across Deauth floods, Disassociation exploits, Rogue APs / Evil Twins, Beacon floods, and Normal traffic.
- **SHAP Feature Attributions**: Mathematical SHapley Additive exPlanations for every classification, revealing the exact frame features driving model decisions.
- **Deterministic Correlation Engine (NetworkX)**: Multi-event clustering based on physical entity matching (BSSID, transmitter MAC, target station, cloned SSID), temporal boundaries, and attack transition rules.
- **Evidence-Linked Investigative Narratives**: Real-time incident syntheses linking every factual deduction to supporting event IDs (`[Event #ID]`), separating facts from hypotheses, and enumerating benign alternatives (e.g. AP roaming or low battery states).
- **Women's Safety & Hidden Camera Scanner (Camera Guard)**: An integrated surveillance detection suite based on `maluta/privacy-scanner` methodology, combining IEEE OUI profiling, RTSP/video socket probing, over-the-air spy camera beacon sweeps, and physical room safety checks.
- **Scandinavian Cyber Minimalist (Aether Neomorphic) Interface**: Clean, distraction-free cockpit design prioritizing functional telemetry, real hardware metrics, and zero decorative placeholders.

---

## 2. System Architecture & 7-Stage Pipeline

The system processes wireless network traffic through an end-to-end, 7-stage analytical pipeline:

```
[ Wireless Adapter / PCAP / CSV ]
               │
               ▼
   [ 1. Ingestion Pipeline ] ──► Computes SHA-256 capture hash & validates schema
               │
               ▼
 [ 2. 802.11 Preprocessing ] ──► Normalizes 12 core frame features & extracts MACs
               │
               ▼
[ 3. Machine Learning Core ] ──► Random Forest Classifier + Isolation Forest
               │
               ▼
    [ 4. Explainability ]    ──► Computes local SHAP attributions via TreeExplainer
               │
               ▼
  [ 5. Correlation Engine ]  ──► Temporal sliding window (90s) + entity graph rules
               │
               ▼
 [ 6. Incident Graph & DB ]  ──► NetworkX DAG construction & SQLite persistence
               │
               ▼
 [ 7. Evidence Narratives ]  ──► Evidence-linked briefs + Gemini 2.5 reasoning
```

### Stage Breakdown
1. **Ingestion (`ingestion.py`)**: Accepts live packets via Scapy 802.11 RadioTap sniffers, uploaded `.pcap` files, or pre-extracted `.csv` telemetry.
2. **Preprocessing (`preprocessing.py`)**: Normalizes 12 key telemetry features (`frame_length`, `frame_type`, `frame_subtype`, `retry_flag`, `seq_num`, `signal_dbm`, `packet_rate`, `delta_time`, `auth_code`, `is_broadcast`, `channel`, `payload_entropy`).
3. **Detection Baseline (`detection.py`)**: Evaluates feature vectors using a trained 120-tree `RandomForestClassifier` and runs `IsolationForest` for anomaly scoring.
4. **Explainability (`explainability.py`)**: Slices decision trees via `shap.TreeExplainer` to calculate exact additive feature impact (positive vs negative pushes).
5. **Correlation Engine (`correlation.py`)**: Evaluates temporal bounds and physical entity intersections to aggregate atomic events into cohesive multi-stage attack campaigns.
6. **Graph Construction (`graph_builder.py`)**: Models incidents as directed graphs exported to Cytoscape.js format.
7. **Investigation & Reporting (`investigation.py` & `reporting.py`)**: Produces formal reports and narratives with clickable citations.

---

## 3. Technology Stack & Repository Layout

### Technology Stack
- **Backend API**: Python 3.11–3.14, FastAPI, Pydantic v2, Uvicorn (ASGI), SQLAlchemy, SQLite.
- **Data Science & ML**: scikit-learn (RandomForestClassifier, IsolationForest), SHAP, NumPy, Pandas.
- **Packet & Network Forensics**: Scapy (Dot11, RadioTap), NetworkX.
- **Frontend Dashboard**: React 19, TypeScript, Vite, Tailwind CSS v4, Cytoscape.js, Lucide Icons.
- **AI Reasoning**: Google Gemini API (`gemini-2.5-flash`) via `@google/genai` with deterministic protocol intelligence fallback.

### Repository Layout
```
project/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI server & SPA static file host
│   │   ├── api/                     # REST API routers
│   │   │   ├── captures.py          # PCAP capture ingestion
│   │   │   ├── events.py            # Normalized event query endpoints
│   │   │   ├── incidents.py         # Incident details, graph, review
│   │   │   ├── reports.py           # Formal forensic report generator
│   │   │   ├── evaluation.py        # Model confusion matrix & SHAP metrics
│   │   │   ├── scanner.py           # Real hardware & simulation radar scanner
│   │   │   ├── privacy.py           # Camera Guard hidden camera scanner
│   │   │   └── gemini.py            # Gemini 2.5 API key configuration
│   │   ├── db/                      # SQLAlchemy database models
│   │   ├── schemas/                 # Pydantic v2 input/output schemas
│   │   └── services/
│   │       ├── detection.py         # Random Forest inference
│   │       ├── explainability.py    # SHAP tree explainer engine
│   │       ├── correlation.py       # Rule-based incident clustering
│   │       ├── graph_builder.py     # NetworkX Cytoscape exporter
│   │       ├── privacy_scanner.py   # maluta/privacy-scanner engine
│   │       └── gemini_service.py    # Gemini narrative generator
│   ├── models/                      # Serialized models & metadata
│   └── tests/                       # 19 automated Pytest unit tests
├── frontend/
│   ├── src/
│   │   ├── components/              # Reusable UI components & modals
│   │   │   ├── Navbar.tsx           # Global header & quick actions
│   │   │   ├── SidebarNav.tsx       # Navigation dock & Camera Guard trigger
│   │   │   ├── NetworkScannerModal.tsx # Live Wi-Fi Radar Scanner
│   │   │   ├── PrivacyScannerModal.tsx # Hidden Camera & Women's Safety Modal
│   │   │   ├── IncidentGraph.tsx    # Cytoscape.js graph component
│   │   │   └── ShapWaterfall.tsx    # SHAP feature impact visualization
│   │   ├── pages/                   # Main views (Overview, Incidents, Detail, etc.)
│   │   ├── api/client.ts            # Typed Axios/Fetch API client
│   │   └── types/index.ts           # Shared TypeScript interfaces
│   ├── dist/                        # Production compiled bundle
│   └── package.json
├── data/                            # Sample PCAPs and training scenarios
├── docs/                            # In-depth architectural & dataset guides
├── start.py                         # 1-Click Python turnkey launcher
└── run_demo.bat                     # Windows batch launcher
```

---

## 4. Machine Learning & Explainable AI (XAI) Engine

### 802.11 Feature Vector
The model evaluates a 12-dimensional normalized feature vector extracted per frame:
1. `frame_length`: Size of the frame in bytes.
2. `frame_type`: 802.11 Type (0=Management, 1=Control, 2=Data).
3. `frame_subtype`: Subtype index (0=Association, 8=Beacon, 10=Disassociation, 12=Deauthentication).
4. `retry_flag`: Boolean 1/0 indicator from frame control flags.
5. `seq_num`: 12-bit frame sequence counter.
6. `signal_dbm`: Received Signal Strength Indicator (RSSI in dBm).
7. `packet_rate`: Moving average frame arrival rate per second.
8. `delta_time`: Inter-arrival time difference from preceding frame (seconds).
9. `auth_code`: Management frame authentication algorithm code.
10. `is_broadcast`: 1 if destination MAC is `ff:ff:ff:ff:ff:ff`, 0 if unicast.
11. `channel`: Operating frequency channel (1–14 for 2.4 GHz, 36–165 for 5 GHz).
12. `payload_entropy`: Shannon entropy score of the frame payload (0.0–8.0).

### Classified Attack Types
- **Deauthentication Flood (`deauth_flood`)**: Burst of spoofed management frames tearing down client-AP connections.
- **Disassociation Attack (`disassociation`)**: Exploits frame subtype 10 to force target stations to re-authenticate.
- **Rogue AP / Evil Twin (`rogue_ap`)**: Cloned SSID broadcasting on conflicting BSSIDs or anomalous signal channels.
- **Beacon Flood (`beacon_flood`)**: Floods SSID tables with fake network advertisements, exhausting client resources.
- **Normal 802.11 Traffic (`normal`)**: Baseline beaconing, data transfer, and authorized management sequences.

### Mathematical SHAP Explainability
Rather than behaving as an opaque black box, every classification is passed through `shap.TreeExplainer`. This computes additive feature importance values that satisfy the efficiency, symmetry, and dummy axioms:

$$\text{Prediction Score} = \text{Base Value} + \sum_{i=1}^{12} \phi_i$$

Where $\phi_i$ represents the directional contribution (positive in red or negative in blue) of feature $i$. In the UI, this is visualized via interactive **SHAP Waterfall Charts**.

---

## 5. Rule-Governed Event Correlation & Graph Builder

Single alerts are correlated into cohesive multi-event incidents using transparent, deterministic rules without speculative causal jumps:

1. **Temporal Proximity**: Events must fall within a sliding 90-second correlation window.
2. **Entity Overlap**:
   - `BSSID_MATCH`: Matching Access Point hardware address.
   - `TARGET_MATCH`: Common victim station MAC address.
   - `TRANSMITTER_MATCH`: Shared adversary transmitter radio MAC.
   - `SSID_CLONE`: Same SSID advertised across differing BSSIDs with severe RSSI deviations.
3. **Behavioral Attack Sequence Compatibility**:
   - Deauth Burst $\rightarrow$ Disassociation Flood $\rightarrow$ Rogue AP Cloned Beacon.
4. **Graph Construction**: Events become nodes; validated correlation criteria become directed edges with typed labels and inter-event time offsets ($\Delta t$).

---

## 6. Camera Guard: Hidden Camera & Women's Privacy Scanner

Derived from the methodology of `maluta/privacy-scanner`, Camera Guard protects women, solo travelers, and hotel guests from covert surveillance devices:

### Surveillance OUI Database
Cross-references every discovered hardware MAC address against dedicated surveillance manufacturer registries:
- **Tier 1 (Enterprise Surveillance & CCTV)**: Hikvision (80+ OUI prefixes), Dahua (30+ OUI prefixes), EZVIZ, Amcrest, Axis Communications, Reolink.
- **Tier 2 (Consumer Wi-Fi Cams)**: Wyze Labs, Blink, Ring, Arlo, Nest, Foscam, Yi Technology, Eufy.
- **Tier 3 (Pinhole & Spy Camera IoT Chipsets)**: Espressif Systems (ESP32-CAM micro-modules), Tuya Smart, Beken Corp, Shenzhen Bilian.

### Active Video Stream Port Probing
Concurrently probes candidate IP addresses across known camera protocols:
- **RTSP Live Video Streams**: Port `554`, `8554`
- **DVR/NVR Management Interfaces**: Port `8000` (Hikvision SADP), `37777` (Dahua RPC), `34567` (Xiongmai)
- **Embedded Web Cams**: Port `80`, `8080`, `8443`

### Over-The-Air Beacon Inspection
Passively sweeps 802.11 beacon frames for ad-hoc SSIDs generated by off-the-shelf spy cameras (e.g. `LookCam_*`, `V380_*`, `HDWiFiCam_*`, `CAM_*`, `MiniCam_*`).

---

## 7. Installation & Turnkey Setup

### System Prerequisites
- **Operating System**: Windows 10/11, macOS, or Linux.
- **Python**: Version 3.11, 3.12, or 3.14.
- **Node.js**: (Optional) Version 18+ if rebuilding frontend from source.
- **Browser**: Modern web browser (Chrome, Edge, Firefox, Brave, Safari).

### Quick 1-Command Launch
Open PowerShell or Command Prompt in the project folder and run:
```powershell
python start.py
```
*(On Windows, you can alternatively double-click `run_demo.bat`)*

`start.py` will automatically:
1. Verify machine learning models (`baseline_rf.joblib`, `background_samples.joblib`).
2. Verify benchmark datasets in `data/samples/`.
3. Initialize the SQLite database and seed initial candidate incidents.
4. Start the unified Uvicorn web server at `http://127.0.0.1:8000`.
5. Open your default web browser to the dashboard.

---

## 8. Step-by-Step User Guide Manual

### 8.1 Wi-Fi Threat Dashboard (Overview)
- **Access**: Open `http://127.0.0.1:8000` or click **Wi-Fi Threat Dashboard** in the sidebar.
- **Header Telemetry**: Displays your active wireless interface adapter name, connected channel (e.g. Ch 44 on 5 GHz), packets swept, and total detected airspace nodes.
- **Filter Pills**: Switch between `All Telemetry`, `RF Spectrum`, `Threat Protection`, and `Gemini AI` views.
- **Mint Activity Graph**: Displays real-time channel occupancy across 2.4 GHz ISM (Channels 1–11) and 5 GHz U-NII bands. Click any channel bar to inspect frequency, bandwidth, and connected transmitter telemetry.
- **Action Buttons**:
  - **Camera Guard**: Opens the hidden camera & privacy scanner modal.
  - **Wi-Fi Threat Scanner**: Launches the live radar scanner modal.
  - **Import PCAP**: Opens the scenario & capture importer.

### 8.2 Live Wi-Fi Threat Scanner (Radar Modal)
- **Opening**: Click the dark **Wi-Fi Threat Scanner** button in the header or the circular radar button in the sidebar.
- **Mode Toggle Switch**:
  - **Real Hardware Mode**: Directly invokes Windows native `netsh wlan show networks mode=bssid` and local ARP tables to sweep real physical airspace.
  - **Demo / Simulation Mode**: Simulates active multi-stage attack scenarios (Deauth flood, Rogue AP, Evil Twin) to demonstrate intrusion detection and SHAP explanations.
- **Interactive Radar**:
  - Sweeping beam rotates across 3 range rings (Immediate Proximity, Local Perimeter, Outer Range).
  - Green blips = Normal 802.11 nodes.
  - Red pulsing blips = Detected attack threats.
  - Hover over any blip to view its tooltip without edge cutoff.
  - Click any blip to lock it into the **Inspected Device Telemetry Card** directly below the radar screen.
- **Threat Mitigation Action**: When threats are discovered, click **Inspect Threat Graph & XAI** to jump directly to the correlation graph and investigate the root cause.

### 8.3 Camera Guard (Hidden Camera & Privacy Scanner)
- **Opening**: Click the **Camera Guard** button in the top header or the eye-shield button in the sidebar dock.
- **Tabs**:
  1. **Scanned Devices**: Shows every discovered subnet host and over-the-air beacon, tagged with risk levels (`safe`, `moderate`, `high`, `critical`), identified vendor, and active video streaming ports (e.g. RTSP 554). Click any device to inspect its MAC address, IP, and risk explanation.
  2. **Physical Room Safety Guide**: Detailed physical inspection protocols for women and travelers (flashlight lens reflection test, two-way mirror fingernail test, and pinhole electronics inspection).
  3. **Methodology**: Explains the 5-phase inspection methodology adapted from `maluta/privacy-scanner`.
- **Scan Trigger**: Click **Re-scan Airspace** at any time to run a fresh multi-phase sweep.

### 8.4 Incidents & Candidate Correlation Graph
- **Access**: Click the **Shield** icon in the sidebar dock.
- **Incident List**: Displays all correlated multi-event incidents ranked by severity (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`).
- **Interactive Cytoscape.js Graph**:
  - Nodes represent individual 802.11 security events with color-coded attack types.
  - Directed edges represent validated correlation rules (`BSSID_MATCH`, `TARGET_MATCH`, `SSID_CLONE`).
  - Click any edge to view the rule explanation and time delta ($\Delta t$).
  - Click any node to open the full event telemetry drawer.
- **Analyst Workflow Actions**:
  - Confirm incident as genuine attack.
  - Reject incident as benign false positive.
  - Request additional PCAP evidence.

### 8.5 Incident Detail Cockpit & SHAP Waterfall
- **Access**: Click **Investigate** on any incident card.
- **Dual View Modes**:
  - **Simple Mode**: High-level executive summary, threat score meter, and plain-language attack narrative.
  - **Technical Mode**: Deep forensic breakdown, full event chronology, and frame-level telemetry.
- **Evidence-Linked Narrative**:
  - Structured claims with clickable citations (e.g., `[Event #104]`). Clicking a citation immediately highlights that event in the timeline and opens its raw frame telemetry.
  - Explicit section separating **Observed Facts** from **Adversary Hypotheses**.
  - **Benign Alternatives**: Outlines non-malicious explanations (e.g., normal 802.11k/v AP roaming, low battery state).
- **SHAP Waterfall Chart**:
  - Visualizes the mathematical contribution of each 802.11 feature toward the model's decision.
  - Red bars push the prediction toward the attack class (e.g., high packet rate, deauth subtype).
  - Blue bars push toward normal baseline behavior.

### 8.6 PCAP Event Log & Frame Telemetry
- **Access**: Click the **Radio** icon in the sidebar dock.
- **Event Table**: Lists all ingested frames with timestamp, source MAC, destination MAC, attack classification, confidence score, and severity.
- **Filtering**: Filter by attack type, minimum confidence threshold, or search by specific MAC/BSSID addresses.
- **Raw Frame Inspector**: Click any row to expand the raw 802.11 header details, RadioTap flags, and sequence counters.

### 8.7 Model & XAI Evaluation Benchmarks
- **Access**: Click the **Cpu** icon in the sidebar dock.
- **Confusion Matrix**: Multi-class confusion matrix displaying classification accuracy across all 5 traffic types.
- **Class-Level Metrics**: Precision, Recall, and F1-score tables for every attack category.
- **Global Feature Importance**: Ranking of the most influential 802.11 features across the entire training corpus.
- **Inference Latency**: Real-time benchmarks showing frame evaluation speed (< 1.2ms per frame).

### 8.8 Forensic Incident Reporting
- **Access**: Click the **FileText** icon in the sidebar dock.
- **Report Generator**: Generates formal forensic incident reports containing executive summaries, event timelines, analyst assessment logs, and remediation guidance.
- **Export Options**: Export as formatted **JSON** or printable **PDF**.

### 8.9 Google Gemini 2.5 Flash Setup
- **Access**: Click the **Gemini 2.5** pill in the top header.
- **Configuration**: Paste your Gemini API key from Google AI Studio and click **Save Configuration**.
- **Autonomous Fallback**: If no API key is provided, the system automatically falls back to deterministic protocol intelligence, generating rich, evidence-linked narratives with zero external dependencies.

---

## 9. Physical Testing & Attacker Simulation Guide

### Testing Real Wi-Fi Detection Safely
To demonstrate detection of an untrusted or rogue access point using physical hardware:
1. **Smartphone Hotspot Setup**:
   - On a smartphone, create a Wi-Fi hotspot named `Guest_Test_AP` or identical to your home network SSID (e.g., `Home_WiFi`).
2. **Open the Scanner**:
   - In the dashboard, click **Wi-Fi Threat Scanner** and ensure **Real Hardware Mode** is selected.
3. **Run Scan**:
   - Click **Run Scan**. The radar will sweep the local RF spectrum.
   - The scanner identifies the cloned or new BSSID, detects channel conflicts, flags anomalous signal strengths, and renders the node on the radar screen.
4. **Camera Guard Test**:
   - Connect any smart home device, IP webcam, or ESP32 board to your local network.
   - Open **Camera Guard** and click **Re-scan Airspace**.
   - The scanner will flag the device's OUI (e.g. Tuya, Espressif, Hikvision) and highlight active RTSP or web ports.

---

## 10. Troubleshooting & FAQ

### Frequently Asked Questions

**Q1: Does this tool require root/administrator privileges?**  
*A:* No. Basic operation, PCAP processing, and standard Wi-Fi scanning (`netsh wlan`) run under regular user privileges on Windows, Linux, and macOS. Live 802.11 monitor mode packet sniffing with Scapy requires administrator/root privileges or standard Npcap drivers.

**Q2: What happens if I don't have a Gemini API key?**  
*A:* The application operates with 100% functionality without an API key. It uses a built-in deterministic protocol reasoning engine to generate evidence-linked narratives, correlation graphs, and SHAP explanations.

**Q3: How do I run the automated test suite?**  
*A:* Open a terminal in the project root and run:
```powershell
python -m pytest backend/tests
```
All 19 automated unit and integration tests should pass with code 0.

**Q4: How do I rebuild the frontend after editing React components?**  
*A:* Open a terminal in `d:/Documents/project/frontend` and run:
```powershell
npm run build
```
This re-compiles TypeScript and bundles the production assets into `frontend/dist/`, which FastAPI serves automatically at `http://127.0.0.1:8000`.

---
*Wireless-IDS — Explainable Airspace SecOps & Wi-Fi Threat Scanner*  
*Prepared for Academic, Defense, and Commercial Security Operations Auditing.*
