"""
backend/app/services/profile_service.py — Learner Profile Orchestration Service

Orchestrates the profile side of the pipeline: calls into ai/ for extraction,
validates, persists via app/db/queries.py. No prompt wording or DB schema
decisions live here — this only wires the two together.
"""

from __future__ import annotations

import sys
from pathlib import Path
from typing import Any

# ai/ and recommender/ live at the repo root, one level above backend/
_REPO_ROOT = Path(__file__).resolve().parents[3]
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))

from ai.prompts.parse_profile import parse_profile as ai_parse_profile  # noqa: E402

from app.db import queries  # noqa: E402


def parse_profile(learner_id: str, raw_text: str) -> dict[str, Any]:
    """Calls ai/prompts/parse_profile.py; does not persist (persistence happens
    via POST /api/profile once the learner reviews/edits on the frontend)."""
    return ai_parse_profile(raw_text)


def persist_profile(learner_id: str, profile_fields: dict[str, Any]) -> dict[str, Any]:
    row = queries.create_learner_profile(learner_id, profile_fields)
    return row


def get_profile(profile_id: str) -> dict[str, Any] | None:
    return queries.get_learner_profile(profile_id)


def update_profile(profile_id: str, updates: dict[str, Any]) -> dict[str, Any] | None:
    return queries.update_learner_profile(profile_id, updates)
