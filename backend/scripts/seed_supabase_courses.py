"""
backend/scripts/seed_supabase_courses.py

Reads recommender/catalog/catalog.json and:
1. Generates backend/app/db/seed_courses.sql with clean SQL INSERT statements.
2. Direct-seeds Supabase table 'courses' if Supabase credentials are configured in .env.
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

_REPO_ROOT = Path(__file__).resolve().parents[2]
_BACKEND_DIR = _REPO_ROOT / "backend"
for p in (str(_REPO_ROOT), str(_BACKEND_DIR)):
    if p not in sys.path:
        sys.path.insert(0, p)

from app.db import queries  # noqa: E402

CATALOG_PATH = _REPO_ROOT / "recommender" / "catalog" / "catalog.json"
SQL_OUTPUT_PATH = _REPO_ROOT / "backend" / "app" / "db" / "seed_courses.sql"


def main():
    if not CATALOG_PATH.exists():
        print(f"Error: {CATALOG_PATH} not found.")
        sys.exit(1)

    with open(CATALOG_PATH, "r", encoding="utf-8") as f:
        courses = json.load(f)

    print(f"Loaded {len(courses)} courses from {CATALOG_PATH.name}...")

    # 1. Generate SQL file
    lines = [
        "-- ============================================================================",
        "-- Seed Data: Central Courses Catalog (PostgreSQL / Supabase)",
        f"-- Total Courses: {len(courses)}",
        "-- Run this in Supabase SQL Editor to populate the 'courses' table",
        "-- ============================================================================",
        "",
        "INSERT INTO courses (id, title, description, type, url, duration_hours, level, domain, tags, prerequisites)",
        "VALUES",
    ]

    value_tuples = []
    for c in courses:
        c_id = c["id"].replace("'", "''")
        title = c["title"].replace("'", "''")
        desc = (c.get("description") or "").replace("'", "''")
        c_type = (c.get("type") or "course").replace("'", "''")
        url = (c.get("url") or "").replace("'", "''")
        dur = c.get("duration_hours", 5)
        level = (c.get("level") or "beginner").replace("'", "''")
        domain = (c.get("domain") or "ai_ml").replace("'", "''")
        tags_json = json.dumps(c.get("tags", [])).replace("'", "''")
        prereqs_json = json.dumps(c.get("prerequisites", [])).replace("'", "''")

        val = (
            f"  ('{c_id}', '{title}', '{desc}', '{c_type}', '{url}', {dur}, '{level}', '{domain}', "
            f"'{tags_json}'::jsonb, '{prereqs_json}'::jsonb)"
        )
        value_tuples.append(val)

    lines.append(",\n".join(value_tuples))
    lines.append("ON CONFLICT (id) DO UPDATE SET")
    lines.append("  title = EXCLUDED.title,")
    lines.append("  description = EXCLUDED.description,")
    lines.append("  type = EXCLUDED.type,")
    lines.append("  url = EXCLUDED.url,")
    lines.append("  duration_hours = EXCLUDED.duration_hours,")
    lines.append("  level = EXCLUDED.level,")
    lines.append("  domain = EXCLUDED.domain,")
    lines.append("  tags = EXCLUDED.tags,")
    lines.append("  prerequisites = EXCLUDED.prerequisites;")

    SQL_OUTPUT_PATH.write_text("\n".join(lines), encoding="utf-8")
    print(f"Generated seed SQL at: {SQL_OUTPUT_PATH}")

    # 2. Try inserting via Supabase SDK if available
    try:
        inserted = queries.upsert_courses(courses)
        print(f"Successfully upserted {len(inserted) or len(courses)} courses directly into Supabase 'courses' table!")
    except Exception as exc:
        print(f"Note: Direct Supabase insert skipped ({exc}). You can run {SQL_OUTPUT_PATH.name} in the Supabase SQL Editor.")


if __name__ == "__main__":
    main()
