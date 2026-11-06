# Dataset Card: 802.11 Wireless Intrusion Telemetry

## 1. Dataset Overview
- **Name**: Wireless IDS 802.11 Protocol Corpus (AWID-Aligned)
- **Domain**: IEEE 802.11 wireless local area networks (WLAN)
- **Target Use**: Training and evaluating machine learning classifiers and explainable AI pipelines for Wi-Fi attack investigation.
- **Reference Standard**: Modeled on the Aegean Wi-Fi Intrusion Dataset (AWID/AWID3) schema and real-world 802.11 packet capture semantics.

## 2. Supported Classes and Distributions
| Label | Description | Sample Protocol Signature | Target Proportion |
|---|---|---|---|
| `Normal` | Legitimate mixed 802.11 wireless activity (browsing, beacons, streaming) | Frame types 0, 1, 2; balanced rates, normal retry rates | ~48% |
| `Deauth_Attack` | Spoofed Deauthentication frame bursts to sever client association | Type=0, Subtype=12, High packet rate (100–300 pkts/s), Auth reason=7/1 | ~15% |
| `Disassoc_Attack` | Disassociation frame flooding targeting connected stations | Type=0, Subtype=10, Packet rate (70–220 pkts/s), Auth reason=8/4 | ~12% |
| `Rogue_AP` | Evil Twin / Rogue AP advertising cloned SSID on distinct channel | Type=0, Subtype=8/5, High anomalous signal strength (-30 dBm), Channel jump | ~13% |
| `Beacon_Flood` | Broadcast beacon saturation with randomized high-entropy SSIDs | Type=0, Subtype=8, Rate (250–750 pkts/s), High payload entropy (>6.5) | ~12% |

## 3. Extracted Feature Schema (12 Features)
1. `frame_length`: Length of the frame in bytes.
2. `frame_type`: 802.11 top-level frame type (0: Management, 1: Control, 2: Data).
3. `frame_subtype`: 802.11 subtype (e.g., 8: Beacon, 10: Disassociation, 12: Deauthentication).
4. `retry_flag`: Boolean flag indicating frame retransmission.
5. `seq_num`: 12-bit sequence number (0–4095).
6. `signal_dbm`: RadioTap antenna signal power in dBm.
7. `packet_rate`: Estimated instantaneous packet rate (packets per second).
8. `delta_time`: Inter-frame arrival time in seconds.
9. `auth_code`: Status or reason code from management frame body.
10. `is_broadcast`: 1 if destination is broadcast (`ff:ff:ff:ff:ff:ff`), 0 otherwise.
11. `channel`: Operating RF channel (1–14 for 2.4GHz).
12. `payload_entropy`: Shannon entropy of payload or SSID string.

## 4. Leakage Prevention and Evaluation Strategy
- **Identity Decoupling**: Hardware identifiers (Source MAC, Destination MAC, BSSID, SSID) are explicitly decoupled from the ML feature matrix and stored separately in `entity_ids`. This prevents the classifier from memorizing MAC addresses as attack indicators.
- **Stratified & Holdout Splitting**: 70% Training, 15% Validation, 15% Unseen Holdout.
- **Session Segregation**: Training and testing frames are drawn from separate simulated capture sessions to prevent duplicate frame leakage.

## 5. Ethical and Legal Boundaries
- Wireless packet captures must only be conducted on infrastructure you own or have explicit, documented authorization to monitor.
- This system does not transmit RF deauthentication or disruption packets. It functions solely as a passive receiver, classifier, and investigation correlation dashboard.
