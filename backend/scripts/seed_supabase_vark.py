"""
backend/scripts/seed_supabase_vark.py

Reads data/vark_questions.json and:
1. Generates backend/app/db/seed_vark_questions.sql with clean SQL INSERT statements.
2. Direct-seeds Supabase table 'vark_questions' if Supabase credentials are configured in .env.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

_REPO_ROOT = Path(__file__).resolve().parents[2]
_BACKEND_DIR = _REPO_ROOT / "backend"
for p in (str(_REPO_ROOT), str(_BACKEND_DIR)):
    if p not in sys.path:
        sys.path.insert(0, p)

from app.db import queries  # noqa: E402

VARK_JSON_PATH = _REPO_ROOT / "data" / "vark_questions.json"
SQL_OUTPUT_PATH = _REPO_ROOT / "backend" / "app" / "db" / "seed_vark_questions.sql"


def main():
    if not VARK_JSON_PATH.exists():
        print(f"Error: {VARK_JSON_PATH} not found.")
        sys.exit(1)

    with open(VARK_JSON_PATH, "r", encoding="utf-8") as f:
        questions = json.load(f)

    print(f"Loaded {len(questions)} VARK questions from {VARK_JSON_PATH.name}...")

    # Generate SQL file
    lines = [
        "-- ============================================================================",
        "-- Seed Data: Official 20-Question VARK Learning Style Questionnaire (Supabase)",
        f"-- Total Questions: {len(questions)}",
        "-- Run this in Supabase SQL Editor to populate the 'vark_questions' table",
        "-- ============================================================================",
        "",
        "INSERT INTO vark_questions (id, question_number, question_text, option_v, option_a, option_r, option_k)",
        "VALUES",
    ]

    value_tuples = []
    for q in questions:
        q_id = q["id"].replace("'", "''")
        num = q["question_number"]
        q_text = q["question_text"].replace("'", "''")
        opt_v = q["option_v"].replace("'", "''")
        opt_a = q["option_a"].replace("'", "''")
        opt_r = q["option_r"].replace("'", "''")
        opt_k = q["option_k"].replace("'", "''")

        val = f"  ('{q_id}', {num}, '{q_text}', '{opt_v}', '{opt_a}', '{opt_r}', '{opt_k}')"
        value_tuples.append(val)

    lines.append(",\n".join(value_tuples))
    lines.append("ON CONFLICT (id) DO UPDATE SET")
    lines.append("  question_number = EXCLUDED.question_number,")
    lines.append("  question_text = EXCLUDED.question_text,")
    lines.append("  option_v = EXCLUDED.option_v,")
    lines.append("  option_a = EXCLUDED.option_a,")
    lines.append("  option_r = EXCLUDED.option_r,")
    lines.append("  option_k = EXCLUDED.option_k;")

    SQL_OUTPUT_PATH.write_text("\n".join(lines), encoding="utf-8")
    print(f"Generated seed SQL at: {SQL_OUTPUT_PATH}")

    # Try direct Supabase insert
    try:
        inserted = queries.upsert_vark_questions(questions)
        print(f"Successfully upserted {len(inserted) or len(questions)} questions directly into Supabase 'vark_questions' table!")
    except Exception as exc:
        print(f"Note: Direct Supabase insert skipped ({exc}). You can run {SQL_OUTPUT_PATH.name} in the Supabase SQL Editor.")


if __name__ == "__main__":
    main()
