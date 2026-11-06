import os
import sys
from datetime import datetime, timedelta
import pandas as pd
import numpy as np

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from scapy.all import wrpcap
from scapy.layers.dot11 import RadioTap, Dot11, Dot11Beacon, Dot11Deauth, Dot11Disas, Dot11Elt


def create_scenario_deauth_flood(output_path: str):
    """
    Scenario 1: Targeted Deauthentication Flood against specific AP and client.
    """
    base_time = datetime(2026, 10, 22, 10, 15, 0)
    rows = []

    # 15 consecutive deauth packets within 45 seconds
    for i in range(15):
        t = base_time + timedelta(seconds=i * 2.8)
        rows.append({
            "timestamp": t.isoformat(),
            "source_ref": f"pcap_seq_{1000 + i}",
            "frame_length": 44,
            "frame_type": 0,  # mgmt
            "frame_subtype": 12,  # deauth
            "retry_flag": 0 if i % 4 != 0 else 1,
            "seq_num": 120 + i,
            "signal_dbm": -46.0 + np.random.normal(0, 1.5),
            "packet_rate": 185.0 + np.random.normal(0, 10),
            "delta_time": 0.0054,
            "auth_code": 7,  # Class 3 frame received from nonassociated STA
            "is_broadcast": 0,
            "channel": 6,
            "payload_entropy": 2.4,
            "src_mac": "00:14:6C:7E:40:80",  # Spoofed AP MAC
            "dst_mac": "40:4E:36:12:34:56",  # Targeted client workstation
            "bssid": "00:14:6C:7E:40:80",
            "ssid": "Corp_Secure_Net"
        })

    df = pd.DataFrame(rows)
    df.to_csv(output_path, index=False)
    print(f"[+] Created {output_path} ({len(df)} records)")


def create_scenario_evil_twin(output_path: str):
    """
    Scenario 2: Multi-stage attack: Deauth burst -> Disassociation -> Rogue AP beacon broadcast.
    """
    base_time = datetime(2026, 10, 22, 11, 30, 0)
    rows = []

    # Step 1: Initial deauth burst (4 events)
    for i in range(4):
        t = base_time + timedelta(seconds=i * 3.0)
        rows.append({
            "timestamp": t.isoformat(),
            "source_ref": f"pcap_seq_{2000 + i}",
            "frame_length": 44,
            "frame_type": 0,
            "frame_subtype": 12,  # deauth
            "retry_flag": 0,
            "seq_num": 450 + i,
            "signal_dbm": -42.0,
            "packet_rate": 190.0,
            "delta_time": 0.004,
            "auth_code": 7,
            "is_broadcast": 0,
            "channel": 6,
            "payload_entropy": 2.5,
            "src_mac": "00:14:6C:7E:40:80",
            "dst_mac": "40:4E:36:12:34:56",
            "bssid": "00:14:6C:7E:40:80",
            "ssid": "Corp_Secure_Net"
        })

    # Step 2: Disassociation event
    t_disas = base_time + timedelta(seconds=14.0)
    rows.append({
        "timestamp": t_disas.isoformat(),
        "source_ref": "pcap_seq_2010",
        "frame_length": 48,
        "frame_type": 0,
        "frame_subtype": 10,  # disassociation
        "retry_flag": 1,
        "seq_num": 456,
        "signal_dbm": -43.0,
        "packet_rate": 140.0,
        "delta_time": 0.007,
        "auth_code": 8,
        "is_broadcast": 0,
        "channel": 6,
        "payload_entropy": 2.6,
        "src_mac": "00:14:6C:7E:40:80",
        "dst_mac": "40:4E:36:12:34:56",
        "bssid": "00:14:6C:7E:40:80",
        "ssid": "Corp_Secure_Net"
    })

    # Step 3: Rogue AP starts beaconing the same SSID from a rogue transmitter
    for j in range(3):
        t_rogue = base_time + timedelta(seconds=22.0 + j * 8.0)
        rows.append({
            "timestamp": t_rogue.isoformat(),
            "source_ref": f"pcap_seq_{2020 + j}",
            "frame_length": 182,
            "frame_type": 0,
            "frame_subtype": 8,  # beacon
            "retry_flag": 0,
            "seq_num": 10 + j,
            "signal_dbm": -31.0,  # Unusually strong anomalous signal
            "packet_rate": 35.0,
            "delta_time": 0.028,
            "auth_code": 0,
            "is_broadcast": 1,
            "channel": 11,  # Rogue operating on different channel
            "payload_entropy": 4.1,
            "src_mac": "02:00:AA:BB:CC:DD",  # Rogue AP MAC
            "dst_mac": "ff:ff:ff:ff:ff:ff",
            "bssid": "02:00:AA:BB:CC:DD",
            "ssid": "Corp_Secure_Net"  # Same cloned SSID!
        })

    df = pd.DataFrame(rows)
    df.to_csv(output_path, index=False)
    print(f"[+] Created {output_path} ({len(df)} records)")


def create_scenario_beacon_flood(output_path: str):
    """
    Scenario 3: Beacon flooding with random high-entropy SSIDs.
    """
    base_time = datetime(2026, 10, 22, 14, 0, 0)
    rows = []

    for i in range(12):
        t = base_time + timedelta(seconds=i * 1.5)
        rows.append({
            "timestamp": t.isoformat(),
            "source_ref": f"pcap_seq_{3000 + i}",
            "frame_length": 118,
            "frame_type": 0,
            "frame_subtype": 8,  # beacon
            "retry_flag": 0,
            "seq_num": np.random.randint(0, 4096),
            "signal_dbm": -52.0,
            "packet_rate": 480.0,  # Extreme flood
            "delta_time": 0.0018,
            "auth_code": 0,
            "is_broadcast": 1,
            "channel": 1,
            "payload_entropy": 7.4,  # Random generated garbage SSID
            "src_mac": f"00:90:4C:{i:02X}:AA:01",
            "dst_mac": "ff:ff:ff:ff:ff:ff",
            "bssid": f"00:90:4C:{i:02X}:AA:01",
            "ssid": f"FreeWifi_x{i:03X}9z"
        })

    df = pd.DataFrame(rows)
    df.to_csv(output_path, index=False)
    print(f"[+] Created {output_path} ({len(df)} records)")


def create_scenario_normal_burst(output_path: str):
    """
    Scenario 4: High volume benign burst (large file download/video stream).
    """
    base_time = datetime(2026, 10, 22, 15, 30, 0)
    rows = []

    for i in range(10):
        t = base_time + timedelta(seconds=i * 2.0)
        rows.append({
            "timestamp": t.isoformat(),
            "source_ref": f"pcap_seq_{4000 + i}",
            "frame_length": 1420,  # Standard TCP/IP data frame over 802.11
            "frame_type": 2,  # Data
            "frame_subtype": 0,  # Data
            "retry_flag": 0 if i % 5 != 0 else 1,
            "seq_num": 800 + i * 15,
            "signal_dbm": -64.0,
            "packet_rate": 150.0,
            "delta_time": 0.006,
            "auth_code": 0,
            "is_broadcast": 0,
            "channel": 6,
            "payload_entropy": 4.6,
            "src_mac": "00:14:6C:7E:40:80",
            "dst_mac": "40:4E:36:12:34:56",
            "bssid": "00:14:6C:7E:40:80",
            "ssid": "Corp_Secure_Net"
        })

    df = pd.DataFrame(rows)
    df.to_csv(output_path, index=False)
    print(f"[+] Created {output_path} ({len(df)} records)")


def create_scenario_unrelated_alerts(output_path: str):
    """
    Scenario 5: Two alerts close in time on completely different BSSIDs/channels (testing anti-false-correlation).
    """
    base_time = datetime(2026, 10, 22, 16, 45, 0)
    rows = [
        # Alert 1: Deauth on AP_Alpha on Channel 1
        {
            "timestamp": base_time.isoformat(),
            "source_ref": "pcap_seq_5001",
            "frame_length": 44,
            "frame_type": 0,
            "frame_subtype": 12,
            "retry_flag": 0,
            "seq_num": 101,
            "signal_dbm": -48.0,
            "packet_rate": 160.0,
            "delta_time": 0.006,
            "auth_code": 7,
            "is_broadcast": 0,
            "channel": 1,
            "payload_entropy": 2.3,
            "src_mac": "AA:11:22:33:44:55",
            "dst_mac": "11:22:33:44:55:66",
            "bssid": "AA:11:22:33:44:55",
            "ssid": "Guest_Lobby"
        },
        # Alert 2: Deauth on AP_Beta on Channel 11, only 4 seconds later
        {
            "timestamp": (base_time + timedelta(seconds=4.0)).isoformat(),
            "source_ref": "pcap_seq_5002",
            "frame_length": 44,
            "frame_type": 0,
            "frame_subtype": 12,
            "retry_flag": 0,
            "seq_num": 890,
            "signal_dbm": -72.0,
            "packet_rate": 175.0,
            "delta_time": 0.005,
            "auth_code": 1,
            "is_broadcast": 0,
            "channel": 11,
            "payload_entropy": 2.4,
            "src_mac": "BB:99:88:77:66:55",
            "dst_mac": "99:88:77:66:55:44",
            "bssid": "BB:99:88:77:66:55",
            "ssid": "Warehouse_Sensors"
        }
    ]

    df = pd.DataFrame(rows)
    df.to_csv(output_path, index=False)
    print(f"[+] Created {output_path} ({len(df)} records)")


def create_sample_pcap(output_path: str):
    """
    Creates an authentic 802.11 PCAP file with RadioTap + Dot11 layers using Scapy.
    """
    packets = []
    base_mac = "00:14:6c:7e:40:80"
    victim_mac = "40:4e:36:12:34:56"
    rogue_mac = "02:00:aa:bb:cc:dd"

    # 1. Normal Beacon
    pkt_beacon = (
        RadioTap(dBm_AntSignal=-60) /
        Dot11(subtype=8, type=0, proto=0, FCfield=0, addr1="ff:ff:ff:ff:ff:ff", addr2=base_mac, addr3=base_mac) /
        Dot11Beacon(cap="ESS+privacy") /
        Dot11Elt(ID="SSID", info="Corp_Secure_Net")
    )
    packets.append(pkt_beacon)

    # 2. Deauth flood burst (5 packets)
    for i in range(5):
        pkt_deauth = (
            RadioTap(dBm_AntSignal=-45) /
            Dot11(subtype=12, type=0, proto=0, FCfield=0, addr1=victim_mac, addr2=base_mac, addr3=base_mac) /
            Dot11Deauth(reason=7)
        )
        packets.append(pkt_deauth)

    # 3. Disassociation frame
    pkt_disas = (
        RadioTap(dBm_AntSignal=-46) /
        Dot11(subtype=10, type=0, proto=0, FCfield=0, addr1=victim_mac, addr2=base_mac, addr3=base_mac) /
        Dot11Disas(reason=8)
    )
    packets.append(pkt_disas)

    # 4. Rogue AP Beacon
    pkt_rogue = (
        RadioTap(dBm_AntSignal=-32) /
        Dot11(subtype=8, type=0, proto=0, FCfield=0, addr1="ff:ff:ff:ff:ff:ff", addr2=rogue_mac, addr3=rogue_mac) /
        Dot11Beacon(cap="ESS+privacy") /
        Dot11Elt(ID="SSID", info="Corp_Secure_Net")
    )
    packets.append(pkt_rogue)

    wrpcap(output_path, packets)
    print(f"[+] Created {output_path} ({len(packets)} packets)")


def generate_all_samples():
    samples_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "samples")
    os.makedirs(samples_dir, exist_ok=True)

    create_scenario_deauth_flood(os.path.join(samples_dir, "wifi_scenario_deauth_flood.csv"))
    create_scenario_evil_twin(os.path.join(samples_dir, "wifi_scenario_rogue_ap_evil_twin.csv"))
    create_scenario_beacon_flood(os.path.join(samples_dir, "wifi_scenario_beacon_flood.csv"))
    create_scenario_normal_burst(os.path.join(samples_dir, "wifi_scenario_normal_burst_benign.csv"))
    create_scenario_unrelated_alerts(os.path.join(samples_dir, "wifi_scenario_mixed_unrelated_alerts.csv"))
    create_sample_pcap(os.path.join(samples_dir, "sample_wireless.pcap"))


if __name__ == "__main__":
    generate_all_samples()
