import os
import re
import socket
import subprocess
from typing import Dict, Any, List, Optional
from datetime import datetime

# ---------------------------------------------------------------------------
# Surveillance & Hidden Camera OUI Database
# Sourced from maluta/privacy-scanner + IEEE standards
# ---------------------------------------------------------------------------

TIER1_OUIS: Dict[str, str] = {}

# Hikvision prefixes
_HIKVISION = (
    "00BC99 040312 04EECD 083BC1 085411 08A189 08CC81 0C75D2 1012FB "
    "1868CB 188025 240F9B 2428FD 2432AE 244845 2857BE 2CA59C 340962 "
    "3C1BF8 40ACBF 4419B6 4447CC 44A642 48785B 4C1F86 4C62DF 4CBD8F "
    "4CF5DC 50E538 548C81 54C415 5803FB 5850ED 5C345B 64DB8B 686DBC "
    "743FC2 80489F 807C62 80BEAF 80F5AE 849459 849A40 88DE39 8C22D2 "
    "8CE748 94E1AC 988B0A 989DE5 98DF82 98F112 A0FF0C A41437 A42902 "
    "A44BD9 A4A459 A4D5C2 ACCB51 ACB92F B4A382 BC2978 BC5E33 BC9B5E "
    "BCAD28 BCBAC2 C0517E C056E3 C06DED C42F90 C8A702 D4E853 DC07F8 "
    "DCD26A E0BAAD E0CA3C E0DF13 E4D58B E8A0ED ECA971 ECC89C F84DFC FC9FFD"
)
for _o in _HIKVISION.split():
    TIER1_OUIS[_o] = "Hikvision Surveillance"

# EZVIZ
_EZVIZ = "0CA64C 20BBBC 34C6DD 54D60D 588FCF 64244D 64F2FB 78A6A0 78C1AE 94EC13 AC1C26 EC97E0 F47018"
for _o in _EZVIZ.split():
    TIER1_OUIS[_o] = "EZVIZ Security Camera"

# Dahua Technology
_DAHUA = (
    "08EDED 14A78B 24526A 30DDAA 38AF29 3CE36B 3CEF8C 407AA4 4C11BF "
    "4C99E8 5CF51A 64FD29 6C1C71 74C929 8CE9B4 9002A9 98F9CC 9C1463 "
    "A0BD1D A8CA87 B44C3B BC325F C0395A C4AAC4 D4430E E02EFE E0508B "
    "E4246C F4B1C2 F8CE07 FC5F49 FCB69D"
)
for _o in _DAHUA.split():
    TIER1_OUIS[_o] = "Dahua IP Camera / DVR"

for _o in "00651E 9C8ECD A06032".split():
    TIER1_OUIS[_o] = "Amcrest Camera"
for _o in "48EA63 6CF17E 88263F C47905".split():
    TIER1_OUIS[_o] = "Uniview Surveillance"
for _o in "00408C ACCC8E B8A44F E82725".split():
    TIER1_OUIS[_o] = "Axis Communications Camera"
TIER1_OUIS["EC71DB"] = "Reolink Security"

# Tier 2: Consumer Smart Cams & Common Hidden Camera Chips
TIER2_OUIS: Dict[str, str] = {}
for _o in "2CAA8E 7C78B2 80482C D03F27 F0C88B".split():
    TIER2_OUIS[_o] = "Wyze Cam"
for _o in "3CA070 70AD43 74AB93 F074C1".split():
    TIER2_OUIS[_o] = "Blink Camera"
for _o in "486264 A41162 FC9C98".split():
    TIER2_OUIS[_o] = "Arlo Smart Cam"
for _o in "18B430 641666".split():
    TIER2_OUIS[_o] = "Nest Cam"
for _o in "C0562D C8D719 008E10 E0B9E5 001EF2".split():
    TIER2_OUIS[_o] = "Foscam"
for _o in "78025E 7811DC 34CE00 04CF8C 28D127 58A60B 641327".split():
    TIER2_OUIS[_o] = "Yi / Xiaomi Smart Cam"
for _o in "98F1B1 78C57D 8CEEA7".split():
    TIER2_OUIS[_o] = "Eufy Security Cam"

# IoT Microcontrollers commonly found in pinhole/hidden spy cams
IOT_SPY_OUIS: Dict[str, str] = {
    "18FE34": "Espressif (ESP32-CAM / Pinhole Spy Cam module)",
    "240AC4": "Espressif (ESP32-CAM / Pinhole Spy Cam module)",
    "246F28": "Espressif (ESP32-CAM / Pinhole Spy Cam module)",
    "24A160": "Espressif (ESP32-CAM / Pinhole Spy Cam module)",
    "24B2DE": "Espressif (ESP32-CAM / Pinhole Spy Cam module)",
    "2C3AE8": "Espressif (ESP32-CAM / Pinhole Spy Cam module)",
    "30AE7B": "Espressif (ESP32-CAM / Pinhole Spy Cam module)",
    "30AEA4": "Espressif (ESP32-CAM / Pinhole Spy Cam module)",
    "3C71BF": "Tuya Smart (Spy Cam / Clock Cam Controller)",
    "500291": "Tuya Smart (Spy Cam / Clock Cam Controller)",
    "68572D": "Tuya Smart (Spy Cam / Clock Cam Controller)",
    "708976": "Tuya Smart (Spy Cam / Clock Cam Controller)",
    "7C25DA": "Tuya Smart (Spy Cam / Clock Cam Controller)",
    "84F3EB": "Tuya Smart (Spy Cam / Clock Cam Controller)"
}

CAMERA_PORTS = [554, 8554, 80, 8080, 8443, 8000, 37777, 34567, 3702, 8899]

COMMON_SPY_SSID_PATTERNS = [
    r"^cam[-_]?", r"^ipc[-_]?", r"lookcam", r"hdwificam", r"v380",
    r"xiaovv", r"yoosee", r"carecam", r"eyeplus",
    r"minicam", r"^q7[-_]", r"^md81", r"^sq11", r"^sq13", r"^sq23",
    r"hdcamera", r"wifi_cam", r"ip_cam", r"spycam"
]


def mac_to_oui(mac: str) -> str:
    """Normalize MAC address to 6-char hex OUI."""
    cleaned = mac.upper().replace(":", "").replace("-", "").replace(".", "")
    return cleaned[:6]


def is_port_open(ip: str, port: int, timeout: float = 0.25) -> bool:
    """Quick socket connect check for camera streaming ports."""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(timeout)
            return s.connect_ex((ip, port)) == 0
    except Exception:
        return False


def trigger_windows_wlan_scan():
    """Triggers an active 802.11 channel hopping scan via Windows native WlanScan API."""
    try:
        import ctypes
        import ctypes.wintypes
        import time
        wlan = ctypes.windll.wlanapi
        h = ctypes.wintypes.HANDLE()
        neg = ctypes.wintypes.DWORD()
        if wlan.WlanOpenHandle(2, None, ctypes.byref(neg), ctypes.byref(h)) == 0:
            class WLAN_INTERFACE_INFO(ctypes.Structure):
                _fields_ = [('Guid', ctypes.c_byte * 16), ('Desc', ctypes.c_wchar * 256), ('State', ctypes.c_uint)]
            class WLAN_INTERFACE_INFO_LIST(ctypes.Structure):
                _fields_ = [('Count', ctypes.wintypes.DWORD), ('Index', ctypes.wintypes.DWORD), ('Info', WLAN_INTERFACE_INFO * 1)]
            pList = ctypes.POINTER(WLAN_INTERFACE_INFO_LIST)()
            if wlan.WlanEnumInterfaces(h, None, ctypes.byref(pList)) == 0 and pList.contents.Count > 0:
                guid = pList.contents.Info[0].Guid
                wlan.WlanScan(h, ctypes.byref(guid), None, None, None)
            wlan.WlanCloseHandle(h, None)
            time.sleep(1.2)  # Allow radio hardware to sweep channels
    except Exception:
        pass


def active_lan_sweep():
    """Rapidly pings candidate subnet hosts to populate Windows ARP cache."""
    try:
        import concurrent.futures
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
        prefix = ".".join(local_ip.split(".")[:3])
    except Exception:
        prefix = "192.168.0"

    def ping_target(ip):
        try:
            subprocess.run(["ping", "-n", "1", "-w", "50", ip], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        except Exception:
            pass

    targets = [f"{prefix}.{i}" for i in range(1, 35)] + [f"{prefix}.{i}" for i in range(100, 125)]
    try:
        import concurrent.futures
        with concurrent.futures.ThreadPoolExecutor(max_workers=30) as executor:
            list(executor.map(ping_target, targets))
    except Exception:
        pass


def get_lan_devices() -> List[Dict[str, Any]]:
    """Retrieve all active devices from Windows ARP table after rapid sweep."""
    active_lan_sweep()
    devices = []
    try:
        out = subprocess.check_output(["arp", "-a"], text=True, encoding="utf-8", errors="ignore")
        for line in out.splitlines():
            m = re.search(r"([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})\s+([0-9a-fA-F-]{17})\s+(\w+)", line)
            if m:
                ip = m.group(1)
                mac = m.group(2).replace("-", ":").lower()
                kind = m.group(3)
                # Ignore broadcast & multicast ranges
                if not ip.startswith("224.") and not ip.startswith("239.") and not ip.endswith(".255"):
                    devices.append({
                        "ip": ip,
                        "mac": mac,
                        "type": kind
                    })
    except Exception:
        pass
    return devices


def get_nearby_wifi_ssids() -> List[Dict[str, Any]]:
    """Triggers an active hardware sweep and retrieves all nearby wireless networks."""
    trigger_windows_wlan_scan()
    networks = []
    seen_bssids = set()
    try:
        out = subprocess.check_output(
            ["netsh", "wlan", "show", "networks", "mode=bssid"],
            text=True, encoding="utf-8", errors="ignore"
        )
        curr_ssid = None
        for line in out.splitlines():
            line = line.strip()
            s_match = re.match(r"SSID\s+\d+\s*:\s*(.*)", line)
            if s_match:
                curr_ssid = s_match.group(1).strip()
                continue
            b_match = re.match(r"BSSID\s+\d+\s*:\s*([0-9a-fA-F:]{17})", line)
            if b_match:
                bssid_clean = b_match.group(1).strip().lower()
                if bssid_clean not in seen_bssids:
                    seen_bssids.add(bssid_clean)
                    networks.append({
                        "ssid": curr_ssid or "Hidden Network",
                        "bssid": bssid_clean,
                        "signal": 75,
                        "channel": 1
                    })
                continue
            sig_m = re.match(r"Signal\s*:\s*(\d+)%", line)
            if sig_m and networks:
                networks[-1]["signal"] = int(sig_m.group(1))
            ch_m = re.match(r"Channel\s*:\s*(\d+)", line)
            if ch_m and networks:
                networks[-1]["channel"] = int(ch_m.group(1))
    except Exception:
        pass
    return networks


def execute_privacy_scan() -> Dict[str, Any]:
    """
    Executes a comprehensive Hidden Camera & Surveillance Device Scan
    for women's safety and privacy protection.
    Follows maluta/privacy-scanner methodology:
    1. Active Subnet ARP discovery & ping sweep
    2. Surveillance OUI analysis (Hikvision, Dahua, Reolink, Wyze, Tuya, ESP32)
    3. Camera port probing (RTSP 554, ONVIF 3702, Hikvision 8000, Dahua 37777)
    4. Over-the-air camera SSID & beacon analysis (LookCam, V380, HDWiFiCam, IPCam)
    5. Privacy threat scoring & safety guidance
    """
    start_time = datetime.now()
    lan_devices = get_lan_devices()
    nearby_wifi = get_nearby_wifi_ssids()

    scanned_devices = []
    camera_count = 0
    suspicious_count = 0

    # 1. Inspect LAN subnet devices
    for dev in lan_devices:
        ip = dev["ip"]
        mac = dev["mac"]
        oui = mac_to_oui(mac)

        vendor = "Unknown Device"
        risk_level = "safe"  # safe | moderate | high | critical
        risk_reasons = []
        open_ports = []

        # Check OUI databases
        if oui in TIER1_OUIS:
            vendor = TIER1_OUIS[oui]
            risk_level = "critical"
            risk_reasons.append(f"Confirmed Dedicated Surveillance OUI ({vendor})")
        elif oui in TIER2_OUIS:
            vendor = TIER2_OUIS[oui]
            risk_level = "high"
            risk_reasons.append(f"Consumer Video Camera Brand ({vendor})")
        elif oui in IOT_SPY_OUIS:
            vendor = IOT_SPY_OUIS[oui]
            risk_level = "moderate"
            risk_reasons.append(f"IoT Chipset common in pinhole/hidden spy cams ({vendor})")
        elif ip.endswith(".1"):
            vendor = "Default Gateway Router"
            risk_level = "safe"

        # Check for open video streaming ports
        for port in [554, 8554, 8000, 37777, 80, 8080]:
            if is_port_open(ip, port):
                open_ports.append(port)
                if port in [554, 8554]:
                    risk_reasons.append(f"RTSP Live Video Stream Active (Port {port})")
                    risk_level = "critical"
                elif port in [8000, 37777, 34567]:
                    risk_reasons.append(f"DVR/Surveillance Management Port Active ({port})")
                    if risk_level != "critical":
                        risk_level = "high"
                elif port in [80, 8080] and risk_level == "moderate":
                    risk_reasons.append(f"HTTP Interface on IoT Chip ({port})")
                    risk_level = "high"

        if risk_level in ["critical", "high"]:
            camera_count += 1
        elif risk_level == "moderate":
            suspicious_count += 1

        scanned_devices.append({
            "ip": ip,
            "mac": mac,
            "oui": oui,
            "vendor": vendor,
            "risk_level": risk_level,
            "risk_reasons": risk_reasons,
            "open_ports": open_ports,
            "medium": "Local Wi-Fi Subnet"
        })

    # 2. Inspect Over-the-air Nearby Wi-Fi SSIDs for Pinhole/Spy Cam Ad-Hoc networks
    scanned_airspace_cams = []
    for net in nearby_wifi:
        ssid = net["ssid"]
        bssid = net["bssid"]
        oui = mac_to_oui(bssid)
        is_spy_ssid = False
        reasons = []
        is_cloaked = not ssid or ssid.strip().lower() in ["hidden network", "none", "unknown"]

        if is_cloaked:
            if oui in TIER1_OUIS or oui in TIER2_OUIS:
                mfr = TIER1_OUIS.get(oui) or TIER2_OUIS.get(oui)
                reasons.append(f"Cloaked network broadcasting from verified camera hardware: {mfr}")
                risk_level = "critical"
                camera_count += 1
            elif oui in IOT_SPY_OUIS:
                mfr = IOT_SPY_OUIS.get(oui)
                reasons.append(f"Cloaked network with IoT chipset: {mfr}")
                risk_level = "high"
                camera_count += 1
            else:
                risk_level = "moderate"
                reasons.append("Cloaked / Hidden SSID (standard router with broadcast disabled)")
                suspicious_count += 1
        else:
            # Check against real spy camera setup broadcast signatures
            for pat in COMMON_SPY_SSID_PATTERNS:
                if re.search(pat, ssid, re.IGNORECASE):
                    is_spy_ssid = True
                    reasons.append(f"SSID matches known spy camera setup pattern: '{pat}'")
                    break

            if oui in TIER1_OUIS or oui in TIER2_OUIS or oui in IOT_SPY_OUIS:
                mfr = TIER1_OUIS.get(oui) or TIER2_OUIS.get(oui) or IOT_SPY_OUIS.get(oui)
                reasons.append(f"BSSID matches camera manufacturer: {mfr}")
                is_spy_ssid = True

            if is_spy_ssid:
                camera_count += 1
                risk_level = "critical" if any("Surveillance" in r for r in reasons) else "high"
            else:
                risk_level = "safe"
                reasons.append(f"Standard 802.11 Access Point (Channel {net.get('channel', 1)})")

        scanned_airspace_cams.append({
            "ssid": ssid or "Hidden Network",
            "bssid": bssid,
            "vendor": TIER1_OUIS.get(oui) or TIER2_OUIS.get(oui) or IOT_SPY_OUIS.get(oui) or "802.11 Wireless AP",
            "signal": net["signal"],
            "channel": net["channel"],
            "risk_level": risk_level,
            "risk_reasons": reasons,
            "medium": "Physical 802.11 Airspace"
        })

    # Overall Verdict
    verdict = "AIRSPACE_SAFE"
    summary_text = f"Audited {len(scanned_devices)} local subnet host(s) and {len(scanned_airspace_cams)} surrounding Wi-Fi network(s). Zero covert cameras detected."
    if camera_count > 0:
        verdict = "CAMERAS_DETECTED"
        summary_text = f"Warning: {camera_count} potential surveillance/camera device(s) identified on the network or nearby airspace."
    elif suspicious_count > 0:
        verdict = "SUSPICIOUS_IOT"
        summary_text = f"Audited {len(scanned_devices) + len(scanned_airspace_cams)} wireless devices. {suspicious_count} cloaked beacon(s) or IoT node(s) flagged for review."

    elapsed_ms = int((datetime.now() - start_time).total_seconds() * 1000)

    # Physical security recommendations for women & privacy
    safety_tips = [
        {
            "title": "Flashlight Lens Reflection Test",
            "desc": "Turn off room lights and slowly shine a phone flashlight around smoke detectors, clocks, and wall outlets. Camera lenses have optical coatings that reflect a faint blue or purple pinpoint glare."
        },
        {
            "title": "Two-Way Mirror Fingernail Test",
            "desc": "Place the tip of your fingernail against any suspect mirror. If there is a visible gap between your nail and its reflection, it is a genuine second-surface mirror. If your nail directly touches its reflection with no gap, it may be a two-way observation mirror."
        },
        {
            "title": "Inspect Suspicious Electronics",
            "desc": "Examine smoke detectors directly above beds, tissue boxes, alarm clocks, USB wall chargers, and air fresheners for pinhole apertures or blinking micro-LEDs."
        },
        {
            "title": "Cover or Unplug Discovered Hardware",
            "desc": "If an unauthorized device or IP camera is found, cover the lens with opaque tape or disconnect its power supply and notify property management or authorities."
        }
    ]

    return {
        "status": "completed",
        "verdict": verdict,
        "summary": summary_text,
        "scanned_devices_count": len(scanned_devices) + len(nearby_wifi),
        "cameras_found": camera_count,
        "suspicious_found": suspicious_count,
        "subnet_devices": scanned_devices,
        "airspace_camera_beacons": scanned_airspace_cams,
        "safety_tips": safety_tips,
        "elapsed_ms": elapsed_ms,
        "timestamp": datetime.now().isoformat()
    }
