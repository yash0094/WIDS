import os
import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from backend.app.db.database import init_db
from backend.app.api import captures, events, detections, incidents, reports, evaluation, gemini, scanner, privacy


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite/Postgres database tables on startup
    init_db()
    yield


app = FastAPI(
    title="Self-Explaining Wireless IDS API",
    description="Explainability-Based Wireless Intrusion Detection, Correlation Graph & Evidence-Linked Attack Investigation",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(captures.router, prefix="/api")
app.include_router(events.router, prefix="/api")
app.include_router(detections.router, prefix="/api")
app.include_router(incidents.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(evaluation.router, prefix="/api")
app.include_router(gemini.router, prefix="/api")
app.include_router(scanner.router, prefix="/api")
app.include_router(privacy.router, prefix="/api")




@app.get("/api/health")
def health_check():
    """System health check endpoint."""
    return {
        "status": "healthy",
        "service": "Self-Explaining Wireless IDS",
        "version": "1.0.0",
        "docs_url": "/docs"
    }


# Check if frontend production dist directory exists
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))
docs_pdf_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "docs", "Wireless-IDS_Documentation_and_User_Guide.pdf"))
docs_pptx_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "docs", "Wireless-IDS_Capstone_Presentation.pptx"))


@app.get("/api/reports/user-guide.pdf")
@app.get("/user-guide.pdf")
@app.get("/api/reports/project-guide.pdf")
@app.get("/project-guide.pdf")
def get_user_guide_pdf():
    """Serves the complete Wireless-IDS documentation, technical report, and user manual PDF."""
    if os.path.exists(docs_pdf_path):
        return FileResponse(
            docs_pdf_path,
            media_type="application/pdf",
            filename="Wireless-IDS_Complete_Project_Manual_and_Defense_Guide.pdf"
        )
    return JSONResponse(status_code=404, content={"detail": "PDF manual not found"})


@app.get("/api/reports/presentation.pptx")
@app.get("/presentation.pptx")
def get_presentation_pptx():
    """Serves the complete 10-slide Wireless-IDS Capstone Presentation PowerPoint."""
    if os.path.exists(docs_pptx_path):
        return FileResponse(
            docs_pptx_path,
            media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
            filename="Wireless-IDS_Capstone_Presentation.pptx"
        )
    return JSONResponse(status_code=404, content={"detail": "PowerPoint presentation not found"})


if os.path.exists(frontend_dist) and os.path.exists(os.path.join(frontend_dist, "index.html")):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")

    @app.get("/{full_path:path}")
    def serve_frontend_spa(full_path: str):
        # Do not catch /api or /docs
        if full_path.startswith("api") or full_path.startswith("docs") or full_path.startswith("openapi.json"):
            return JSONResponse(status_code=404, content={"detail": "Not found"})
        target_file = os.path.join(frontend_dist, full_path)
        if full_path and os.path.isfile(target_file):
            return FileResponse(target_file)
        return FileResponse(os.path.join(frontend_dist, "index.html"))
else:
    @app.get("/")
    def root():
        return {
            "message": "Welcome to Self-Explaining Wireless IDS API. Visit /docs for the interactive Swagger documentation.",
            "health": "/api/health"
        }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="127.0.0.1", port=8000, reload=True)
