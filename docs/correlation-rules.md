# Correlation Rules & Incident Graph Schema

## 1. Philosophical Foundations
In accordance with the Capstone Project Guide:
> **"An alert, a model prediction, and a proven cause are different things. The system must not state that an attack is confirmed merely because events occurred close together. Treat generated incident stories as hypotheses unless the evidence supports a stronger conclusion."**

The correlation engine avoids black-box graph scoring in favor of **deterministic, auditable rules** where every graph edge stores its rule version, time delta, and matching evidence.

## 2. Graph Definition
- **Nodes ($V$)**: Normalized 802.11 security events with model classification, confidence, entity IDs, and SHAP explanation.
- **Edges ($E$)**: Directed relationships $E = (u, v)$ with attributes:
  - `relationship_type`: `temporal`, `shared_entity`, `pattern_match`, `analyst_confirmed`
  - `reason`: Plain English explanation of why the link was established.
  - `time_delta_seconds`: Absolute time difference $|t_v - t_u|$.
  - `rule_version`: e.g., `v1.2-wireless-transparent`.
  - `evidence_json`: Shared identifiers (MACs, BSSIDs, SSIDs).

## 3. Correlation Rules
### Rule 1: Temporal Window Boundary
$$\Delta t = |t_b - t_a| \le 90.0\text{ seconds}$$
If two events occur farther apart than 90 seconds, no candidate edge is created.

### Rule 2: Entity Overlap Requirement
Candidate events must share at least one trustworthy, non-broadcast wireless identifier:
1. **Identical BSSID**: Same Access Point radio MAC (`bssid_a == bssid_b`).
2. **Identical Source MAC**: Same transmitter radio (`src_a == src_b`).
3. **Identical Target Station**: Same victim workstation (`dst_a == dst_b`).
4. **Matching Cloned SSID**: Same network identifier broadcast from differing BSSIDs (Evil Twin signature).

*Anti-False-Correlation Guard*: Events sharing only timestamp proximity on disjoint BSSIDs and disjoint channels are **never linked**.

### Rule 3: Multi-Stage Behavioral Pattern Matrix
When two related events exhibit a known attack progression, the edge is categorized as `pattern_match`:
| Prior Event ($u$) | Subsequent Event ($v$) | Progression Pattern | Investigation Meaning |
|---|---|---|---|
| `Deauth_Attack` | `Disassoc_Attack` | Forced Disconnection Phase | Attacker cycling disconnect frame subtypes |
| `Deauth_Attack` | `Rogue_AP` | Deauth-to-EvilTwin Hijack | Victim severed from genuine AP, lured to rogue clone |
| `Disassoc_Attack` | `Rogue_AP` | Disassoc-to-EvilTwin Hijack | Station forced to re-associate to clone AP |
| `Beacon_Flood` | `Deauth_Attack` | Denial of Service Cascade | Channel saturation combined with targeted disconnect |
| `Deauth_Attack` | `Deauth_Attack` | Sustained Deauth Campaign | Consecutive targeted bursts over time |
| `Rogue_AP` | `Rogue_AP` | Persistent Rogue AP Presence | Continuous anomalous beacon broadcasts |

## 4. Connected Components & Incident Creation
1. NetworkX computes connected components over all validated edges.
2. If multiple events are connected, they are bundled into a multi-stage `Candidate Incident`.
3. If an event has no valid edges, it is retained as an **Isolated Suspicious Event** (avoiding synthetic multi-stage hallucination).
4. Severity is computed deterministically:
   - **CRITICAL**: Multi-stage hijack (`Deauth_Attack` + `Rogue_AP`).
   - **HIGH**: Distributed deauth flood ($>3$ alerts), Rogue AP, or Beacon flood.
   - **MEDIUM**: Single deauth or disassoc anomaly.
   - **LOW**: Low-rate frame irregularity.
