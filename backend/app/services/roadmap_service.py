"""
backend/app/services/roadmap_service.py — Roadmap Orchestration Service

Orchestrates: recommender.get_candidates() -> ai.generate_roadmap() -> persist,
plus explain/feedback/replan. No ranking logic and no prompt wording live
here — this only calls into ai/ and recommender/ and handles persistence per
Section 7's versioning rule (re-plan = new roadmap row, version + 1).
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

_REPO_ROOT = Path(__file__).resolve().parents[3]
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))

from ai.prompts.explain_item import explain_item as ai_explain_item  # noqa: E402
from ai.prompts.generate_roadmap import generate_roadmap as ai_generate_roadmap  # noqa: E402
from ai.prompts.replan import replan as ai_replan  # noqa: E402
from recommender.ranking import get_candidates  # noqa: E402

from app.db import queries  # noqa: E402

_CATALOG_PATH = _REPO_ROOT / "recommender" / "catalog" / "catalog.json"


def _load_catalog() -> list[dict[str, Any]]:
    try:
        db_courses = queries.get_all_courses()
        if db_courses and len(db_courses) > 0:
            return db_courses
    except Exception as exc:
        print(f"[catalog] Supabase course table read: {exc}, using local catalog fallback.")

    if _CATALOG_PATH.exists():
        with open(_CATALOG_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    return []


def _resource_by_id(resource_id: str, catalog: list[dict[str, Any]]) -> dict[str, Any] | None:
    return next((r for r in catalog if r["id"] == resource_id), None)


def _expand_items(items: list[dict[str, Any]], catalog: list[dict[str, Any]]) -> list[dict[str, Any]]:
    expanded = []
    for item in items:
        resource = _resource_by_id(item["resource_id"], catalog)
        expanded.append({**item, "resource": resource})
    return expanded


def generate_roadmap(profile_id: str) -> dict[str, Any]:
    profile = queries.get_learner_profile(profile_id)
    if profile is None:
        raise ValueError("profile_not_found")

    catalog = _load_catalog()
    candidates = get_candidates(profile, catalog=catalog, top_k=40)

    ai_result = ai_generate_roadmap(profile, candidates)

    roadmap_row = queries.create_roadmap(learner_profile_id=profile_id, version=1)

    items_to_insert = [
        {
            "resource_id": item["resource_id"],
            "order": item["order"],
            "status": "current" if item["order"] == 1 else "upcoming",
            "milestone": item["milestone"],
            "reason": item["reason"],
        }
        for item in ai_result["items"]
    ]
    created_items = queries.bulk_create_roadmap_items(roadmap_row["id"], items_to_insert)

    return {
        **roadmap_row,
        "items": _expand_items(created_items, catalog),
    }


def get_roadmap(roadmap_id: str) -> dict[str, Any] | None:
    roadmap_row = queries.get_roadmap(roadmap_id)
    if roadmap_row is None:
        return None
    catalog = _load_catalog()
    items = queries.get_roadmap_items(roadmap_id)

    # Check learner's globally completed courses across all roadmaps
    if roadmap_row.get("learner_profile_id"):
        prof = queries.get_learner_profile(roadmap_row["learner_profile_id"])
        if prof and prof.get("learner_id"):
            completed_res_ids = queries.get_completed_resource_ids_for_learner(prof["learner_id"])
            for it in items:
                if it.get("resource_id") in completed_res_ids and it.get("status") not in ("completed", "skipped"):
                    it["status"] = "completed"

    return {**roadmap_row, "items": _expand_items(items, catalog)}


def explain_item(roadmap_item_id: str, profile_id: str) -> dict[str, Any]:
    profile = queries.get_learner_profile(profile_id)
    roadmap_item = queries.get_roadmap_item(roadmap_item_id)
    if profile is None or roadmap_item is None:
        raise ValueError("not_found")

    catalog = _load_catalog()
    resource = _resource_by_id(roadmap_item["resource_id"], catalog)
    if resource is None:
        raise ValueError("resource_not_in_catalog")

    return ai_explain_item(profile, resource, roadmap_item)


def submit_feedback(roadmap_item_id: str, action: str, note: str | None, roadmap_id: str) -> dict[str, Any]:
    updated = queries.update_roadmap_item_status(roadmap_item_id, "completed" if action == "complete" else "skipped")
    queries.create_feedback(roadmap_item_id, action, note)

    all_items = queries.get_roadmap_items(roadmap_id)
    total = len(all_items)
    done = sum(1 for i in all_items if i["status"] in ("completed", "skipped"))
    progress_percent = round((done / total) * 100, 1) if total else 0.0

    # Simple, transparent replan trigger: recommend re-planning any time an
    # item is skipped, or after every 3rd completion (keeps the roadmap
    # responsive without re-planning on every single click).
    replan_recommended = action == "skip" or (done % 3 == 0 and done > 0)

    return {
        "feedback_id": updated["id"] if updated else None,
        "updated_item_status": updated["status"] if updated else None,
        "progress_percent": progress_percent,
        "replan_recommended": replan_recommended,
    }


def replan_roadmap(roadmap_id: str) -> dict[str, Any]:
    old_roadmap = queries.get_roadmap(roadmap_id)
    if old_roadmap is None:
        raise ValueError("roadmap_not_found")

    profile = queries.get_learner_profile(old_roadmap["learner_profile_id"])
    old_items = queries.get_roadmap_items(roadmap_id)
    catalog = _load_catalog()

    # Get all completed resources for this learner globally
    learner_completed_ids = set()
    if profile and profile.get("learner_id"):
        learner_completed_ids = queries.get_completed_resource_ids_for_learner(profile["learner_id"])

    history = [
        {
            "resource_id": i["resource_id"],
            "status": "completed" if i["resource_id"] in learner_completed_ids else i["status"],
            "title": (_resource_by_id(i["resource_id"], catalog) or {}).get("title", ""),
        }
        for i in old_items
        if i["status"] in ("completed", "skipped") or i["resource_id"] in learner_completed_ids
    ]
    completed_ids = {h["resource_id"] for h in history if h["status"] == "completed"}.union(learner_completed_ids)

    candidates = get_candidates(profile, catalog=catalog, top_k=40, completed_ids=completed_ids)
    ai_result = ai_replan(profile, history, candidates)

    latest_rm = queries.get_latest_roadmap_for_profile(old_roadmap["learner_profile_id"]) or old_roadmap
    max_version = latest_rm.get("version", 1)

    # Check if upcoming recommended items are already identical to current roadmap items
    old_upcoming_ids = [
        i["resource_id"]
        for i in old_items
        if i.get("status") not in ("completed", "skipped") and i.get("resource_id") not in completed_ids
    ]
    new_upcoming_ids = [i["resource_id"] for i in ai_result.get("items", [])]

    if old_upcoming_ids and old_upcoming_ids == new_upcoming_ids:
        return {
            "roadmap": {**latest_rm, "items": _expand_items(old_items, catalog)},
            "changes_summary": "Your learning roadmap is already fully up to date with your current competencies. Complete pending courses to unlock subsequent milestones!",
            "unchanged": True,
        }

    # Copy forward finalized items unchanged (with accurate completed status)
    carried_forward = [
        {
            "resource_id": i["resource_id"],
            "order": i["order"],
            "status": "completed" if i["resource_id"] in completed_ids else i["status"],
            "milestone": i["milestone"],
            "reason": i["reason"],
        }
        for i in old_items
        if i["status"] in ("completed", "skipped") or i["resource_id"] in completed_ids
    ]
    next_order = max((i["order"] for i in carried_forward), default=0) + 1

    new_items = [
        {
            "resource_id": item["resource_id"],
            "order": next_order + idx,
            "status": "current" if idx == 0 else "upcoming",
            "milestone": item["milestone"],
            "reason": item["reason"],
        }
        for idx, item in enumerate(ai_result["items"])
    ]

    created_items_payload = carried_forward + new_items
    old_resource_ids = [i["resource_id"] for i in old_items]
    proposed_resource_ids = [i["resource_id"] for i in created_items_payload]
    old_statuses = [i.get("status") for i in old_items]
    proposed_statuses = [i.get("status") for i in created_items_payload]

    # If nothing has changed in completions or sequence, do not increment version
    if old_resource_ids == proposed_resource_ids and old_statuses == proposed_statuses:
        return {
            "roadmap": {**latest_rm, "items": _expand_items(old_items, catalog)},
            "changes_summary": "Your learning roadmap is already fully up to date with your current competencies. Complete pending courses to unlock subsequent milestones!",
            "unchanged": True,
        }

    new_version = max_version + 1
    new_roadmap_row = queries.create_roadmap(learner_profile_id=old_roadmap["learner_profile_id"], version=new_version)

    created_items = queries.bulk_create_roadmap_items(new_roadmap_row["id"], created_items_payload)

    return {
        "roadmap": {**new_roadmap_row, "items": _expand_items(created_items, catalog)},
        "changes_summary": ai_result["changes_summary"],
        "unchanged": False,
    }
