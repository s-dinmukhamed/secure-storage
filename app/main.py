import logging
from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.core.database import DATABASE_URL, Base, engine
from app.routers import admin, auth, files

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Secure File Vault", version="1.0.0")
frontend_dist = Path(__file__).resolve().parent.parent / "frontend" / "dist"
logger = logging.getLogger("secure_vault")

if (frontend_dist / "assets").exists():
    app.mount("/assets", StaticFiles(directory=frontend_dist / "assets"), name="assets")

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(files.router, prefix="/files", tags=["files"])
app.include_router(admin.router, prefix="/admin", tags=["admin"])


@app.get("/", include_in_schema=False)
def index():
    index_file = frontend_dist / "index.html"
    if not index_file.exists():
        return {"message": "Secure File Vault API"}
    return FileResponse(index_file)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.on_event("startup")
def log_startup_info():
    logger.warning("Secure Vault DB: %s", DATABASE_URL)
