import os
import sys

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.db.database import SessionLocal, init_db
from backend.app.services.ingestion import ingest_file_pipeline
from backend.app.db.models import Incident, AnalystReview, EventEdge, IncidentEvent, Detection, Event, Capture


def seed(force: bool = False):
    print("[*] Initializing database tables...")
    init_db()

    db = SessionLocal()
    try:
        if force or "--force" in sys.argv or "-f" in sys.argv:
            print("[*] Clearing existing database tables for clean re-seed...")
            db.query(AnalystReview).delete()
            db.query(EventEdge).delete()
            db.query(IncidentEvent).delete()
            db.query(Incident).delete()
            db.query(Detection).delete()
            db.query(Event).delete()
            db.query(Capture).delete()
            db.commit()
            print("[+] Database cleared successfully.")
        else:
            existing = db.query(Incident).count()
            if existing > 0:
                print(f"[*] Database already contains {existing} incidents. Skipping seeding. Pass --force to re-seed.")
                return

        samples_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "samples")

        scenarios = [
            ("wifi_scenario_rogue_ap_evil_twin.csv", "csv"),
            ("wifi_scenario_deauth_flood.csv", "csv"),
            ("wifi_scenario_beacon_flood.csv", "csv"),
            ("wifi_scenario_normal_burst_benign.csv", "csv"),
            ("wifi_scenario_mixed_unrelated_alerts.csv", "csv")
        ]

        print("[*] Ingesting scenario datasets into database...")
        for fname, stype in scenarios:
            fpath = os.path.join(samples_dir, fname)
            if os.path.exists(fpath):
                print(f"  -> Ingesting {fname}...")
                res = ingest_file_pipeline(fpath, db, source_type=stype)
                print(f"     Processed: {res['total_events']} events, {res['total_incidents']} candidate incidents, {res['total_edges']} edges.")

        # Add a sample analyst review to the first incident
        first_incident = db.query(Incident).first()
        if first_incident:
            review = AnalystReview(
                incident_id=first_incident.id,
                reviewer_decision="confirmed",
                notes="Verified rogue transmitter signal strength -31 dBm on channel 11. Cloned SSID matches Corp_Secure_Net. Recommended activating 802.11w PMF.",
                reviewer_name="Harsha (Senior SOC Analyst)"
            )
            db.add(review)
            first_incident.status = "analyst_confirmed"
            first_incident.analyst_summary = review.notes
            db.commit()
            print(f"[+] Added sample analyst review to incident #{first_incident.id} ({first_incident.title})")

        print("[+] Database seeding complete!")

    finally:
        db.close()


if __name__ == "__main__":
    seed()
