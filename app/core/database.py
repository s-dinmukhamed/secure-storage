import os
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

PROJECT_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_SQLITE_PATH = PROJECT_ROOT / "vault.db"


def _normalize_database_url(raw_url: str) -> str:
    if raw_url == "sqlite:///:memory:":
        return raw_url

    # Normalize relative sqlite URLs so DB location does not depend on cwd.
    if raw_url.startswith("sqlite:///./"):
        relative_path = raw_url.replace("sqlite:///./", "", 1)
        return f"sqlite:///{(PROJECT_ROOT / relative_path).resolve()}"

    if raw_url.startswith("sqlite:///") and not raw_url.startswith("sqlite:////"):
        relative_path = raw_url.replace("sqlite:///", "", 1)
        return f"sqlite:///{(PROJECT_ROOT / relative_path).resolve()}"

    return raw_url


DATABASE_URL = _normalize_database_url(
    os.getenv("DATABASE_URL", f"sqlite:///{DEFAULT_SQLITE_PATH}")
)

engine_kwargs = {}
if DATABASE_URL.startswith("sqlite:///"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, **engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
