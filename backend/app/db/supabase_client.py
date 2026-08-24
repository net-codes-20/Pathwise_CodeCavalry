"""
backend/app/db/supabase_client.py — Supabase Client Factory

Single Supabase client instance for the whole backend. Keys come from
environment variables only (backend/.env, or platform env vars on Render) —
never hardcoded, never exposed to the frontend.
"""

from __future__ import annotations

import os
from functools import lru_cache

from supabase import Client, create_client


@lru_cache(maxsize=1)
def get_supabase() -> Client:
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_KEY")
    if not url or not key:
        raise RuntimeError(
            "SUPABASE_URL and SUPABASE_KEY must be set in the environment "
            "(see backend/.env.example). Never hardcode these."
        )
    return create_client(url, key)
