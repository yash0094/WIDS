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

    port = int(os.environ.get("PORT", 8000))
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

    import uvicorn
    backend_dir = os.path.join(PROJECT_ROOT, "backend")
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=port, reload=is_reload, reload_dirs=[backend_dir] if is_reload else None)


if __name__ == "__main__":
    run_server()
