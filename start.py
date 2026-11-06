import os
import sys
import subprocess
import webbrowser
import time

PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, PROJECT_ROOT)


def check_and_prepare_artifacts():
    print("=" * 70)
    print("  Self-Explaining Wireless IDS - Capstone System Startup")
    print("=" * 70)

    # 1. Check trained model
    model_path = os.path.join(PROJECT_ROOT, "backend", "models", "baseline_rf.joblib")
    if not os.path.exists(model_path):
        print("[*] Model artifacts not found. Training Random Forest baseline and SHAP explainer...")
        from scripts.train_model import train_and_evaluate_model
        train_and_evaluate_model()
    else:
        print("[+] Trained model and SHAP explainer found.")

    # 2. Check sample scenarios
    samples_dir = os.path.join(PROJECT_ROOT, "data", "samples")
    if not os.path.exists(samples_dir) or len(os.listdir(samples_dir)) == 0:
        print("[*] Generating scenario corpus and sample PCAP...")
        from scripts.generate_synthetic_scenarios import generate_all_samples
        generate_all_samples()
    else:
        print("[+] Scenario corpus and sample PCAPs found.")

    # 3. Seed database
    db_file = os.path.join(PROJECT_ROOT, "backend", "wireless_ids.db")
    if not os.path.exists(db_file):
        print("[*] Seeding database with initial incidents, correlation edges, and reviews...")
        from scripts.seed_database import seed
        seed()
    else:
        from scripts.seed_database import seed
        seed()
        print("[+] Wireless IDS database initialized.")


def is_port_in_use(port: int, host: str = "127.0.0.1") -> bool:
    import socket
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.3)
        return s.connect_ex((host, port)) == 0


def resolve_port(preferred_port: int) -> int:
    # 1. If explicit environment variable PORT is set (cloud hosts like Render/Railway), honor it
    if "PORT" in os.environ:
        return int(os.environ["PORT"])

    # 2. Check if preferred port is free
    if not is_port_in_use(preferred_port):
        return preferred_port

    # 3. Port is occupied (e.g., by Splunk Enterprise, Apache, etc.)
    print("\n" + "!" * 70)
    print(f"  [!] Port {preferred_port} is already in use by another application on this laptop!")
    print(f"      (Common conflict: Splunk Enterprise, Apache, or a background server uses 8000).")

    candidate_ports = [8080, 8088, 5000, 8888, 9000]
    for candidate in candidate_ports:
        if not is_port_in_use(candidate):
            print(f"  [+] Automatically redirecting Wireless IDS to available port: {candidate}")
            print("!" * 70 + "\n")
            return candidate

    print(f"  [!] Warning: Could not find a free candidate port. Attempting {preferred_port}...")
    print("!" * 70 + "\n")
    return preferred_port


def run_server():
    check_and_prepare_artifacts()

    import socket
    local_ip = "127.0.0.1"
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
    except Exception:
        pass

    # Parse port from CLI if provided (e.g., python start.py 8080 or --port 8080)
    preferred_port = 8000
    for i, arg in enumerate(sys.argv[1:], start=1):
        if arg.isdigit():
            preferred_port = int(arg)
            break
        elif arg in ("--port", "-p") and i < len(sys.argv) - 1:
            try:
                preferred_port = int(sys.argv[i + 1])
                break
            except ValueError:
                pass

    port = resolve_port(preferred_port)
    is_cloud = bool(os.environ.get("PORT") or os.environ.get("RENDER") or os.environ.get("RAILWAY_STATIC_URL"))
    default_reload = "false" if is_cloud else "true"
    is_reload = os.environ.get("RELOAD", default_reload).lower() in ("true", "1", "yes")

    print("\n" + "=" * 70)
    print("  [+] Starting Self-Explaining Wireless IDS Application")
    print(f"  -> Local Dashboard:    http://127.0.0.1:{port}")
    print(f"  -> Network (LAN) Host:  http://{local_ip}:{port}")
    print(f"  -> API Swagger Docs:    http://127.0.0.1:{port}/docs")
    print(f"  -> Health Check:        http://127.0.0.1:{port}/api/health")
    print("=" * 70 + "\n")

    # Auto-open browser on local launch if requested or first run
    if not is_cloud and os.environ.get("OPEN_BROWSER", "true").lower() in ("true", "1", "yes"):
        def open_browser():
            time.sleep(1.2)
            try:
                webbrowser.open(f"http://127.0.0.1:{port}")
            except Exception:
                pass
        import threading
        threading.Thread(target=open_browser, daemon=True).start()

    import uvicorn
    backend_dir = os.path.join(PROJECT_ROOT, "backend")
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=port, reload=is_reload, reload_dirs=[backend_dir] if is_reload else None)


if __name__ == "__main__":
    run_server()
