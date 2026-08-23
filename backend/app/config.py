"""
backend/app/config.py — Centralized Backend Configuration

Centralized env var access. Every key the backend needs comes from the
environment only (backend/.env locally, platform env vars on Render).
Nothing here should ever contain a real secret value.
"""

from __future__ import annotations

import os
from pathlib import Path

try:
    from dotenv import load_dotenv

    # Single root .env for the whole project (repo_root/.env), not a
    # per-folder one — see .env.example at the repo root.
    _REPO_ROOT = Path(__file__).resolve().parents[2]
    load_dotenv(_REPO_ROOT / ".env")
except ImportError:
    pass


class Settings:
    SUPABASE_URL: str = os.environ.get("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.environ.get("SUPABASE_KEY", "")
    CORS_ORIGINS: list[str] = [
        o.strip() for o in os.environ.get("CORS_ORIGINS", "http://localhost:5173").split(",") if o.strip()
    ]


settings = Settings()
