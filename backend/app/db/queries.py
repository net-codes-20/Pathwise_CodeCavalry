"""
backend/app/db/queries.py — Supabase Data Layer & Database Operations

All raw Supabase table access lives here. Services (app/services/) call these
functions instead of touching the Supabase client directly, so the query
shape stays in one place and matches Section 7 of the technical spec exactly.
"""

from __future__ import annotations

from typing import Any

from app.db.supabase_client import get_supabase

# ---- learners ----------------------------------------------------------


import hashlib
import hmac


def _hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def find_learner_by_username(username: str) -> dict[str, Any] | None:
    db = get_supabase()
    result = db.table("learners").select("*").eq("username", username).limit(1).execute()
    return result.data[0] if result.data else None


def verify_learner_password(learner: dict[str, Any], password: str) -> bool:
    stored_hash = learner.get("password_hash", "")
    return hmac.compare_digest(stored_hash, _hash_password(password))


def create_learner(name: str) -> dict[str, Any]:
    """Legacy function — kept for backwards-compat with smoke tests."""
    db = get_supabase()
    result = db.table("learners").insert({"name": name}).execute()
    return result.data[0]


def create_learner_with_credentials(name: str, username: str, password: str) -> dict[str, Any]:
    db = get_supabase()
    result = db.table("learners").insert({
        "name": name,
        "username": username,
        "password_hash": _hash_password(password),
        "theme": "light",
    }).execute()
    return result.data[0]


def get_learner(learner_id: str) -> dict[str, Any] | None:
    db = get_supabase()
    result = db.table("learners").select("*").eq("id", learner_id).limit(1).execute()
    return result.data[0] if result.data else None


def update_learner_theme(learner_id: str, theme: str) -> dict[str, Any] | None:
    db = get_supabase()
    result = db.table("learners").update({"theme": theme}).eq("id", learner_id).execute()
    return result.data[0] if result.data else None


def update_learner_account(learner_id: str, name: str | None = None, password: str | None = None) -> dict[str, Any] | None:
    db = get_supabase()
    updates = {}
    if name and name.strip():
        updates["name"] = name.strip()
    if password and password.strip():
        updates["password_hash"] = _hash_password(password.strip())
    if not updates:
        return None
    result = db.table("learners").update(updates).eq("id", learner_id).execute()
    return result.data[0] if result.data else None


def get_latest_profile_for_learner(learner_id: str) -> dict[str, Any] | None:
    db = get_supabase()
    result = (
        db.table("learner_profiles")
        .select("*")
        .eq("learner_id", learner_id)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    return _map_profile_row(result.data[0]) if result.data else None


# ---- courses (central catalog) -------------------------------------------


def get_all_courses() -> list[dict[str, Any]]:
    db = get_supabase()
    result = db.table("courses").select("*").execute()
    return result.data or []


def get_course_by_id(course_id: str) -> dict[str, Any] | None:
    db = get_supabase()
    result = db.table("courses").select("*").eq("id", course_id).limit(1).execute()
    return result.data[0] if result.data else None


def upsert_courses(courses: list[dict[str, Any]]) -> list[dict[str, Any]]:
    db = get_supabase()
    result = db.table("courses").upsert(courses).execute()
    return result.data or []


# ---- vark_questions (official questionnaire) ----------------------------


def get_vark_questions() -> list[dict[str, Any]]:
    db = get_supabase()
    result = db.table("vark_questions").select("*").order("question_number").execute()
    return result.data or []


def upsert_vark_questions(questions: list[dict[str, Any]]) -> list[dict[str, Any]]:
    db = get_supabase()
    result = db.table("vark_questions").upsert(questions).execute()
    return result.data or []


# ---- learner_profiles ---------------------------------------------------


def _map_profile_row(row: dict[str, Any] | None) -> dict[str, Any] | None:
    if row is None:
        return None
    mapped = {**row}
    dominant_style = mapped.get("dominant_style")
    vark_scores = mapped.get("vark_scores")
    vark_raw_string = mapped.get("vark_raw_string")
    if dominant_style is not None or vark_scores is not None or vark_raw_string is not None:
        mapped["learning_style"] = {
            "dominant_style": dominant_style,
            "scores": vark_scores or {"visual": 0, "auditory": 0, "read_write": 0, "kinesthetic": 0},
            "raw_string": vark_raw_string,
        }
    else:
        mapped["learning_style"] = None
    return mapped


def create_learner_profile(learner_id: str, profile: dict[str, Any]) -> dict[str, Any]:
    db = get_supabase()
    ls = profile.get("learning_style")
    payload = {
        "learner_id": learner_id,
        "goal": profile["goal"],
        "goal_type": profile["goal_type"],
        "experience_level": profile["experience_level"],
        "current_skills": profile.get("current_skills", []),
        "interests": profile.get("interests", []),
        "timeline_months": profile.get("timeline_months"),
        "weekly_time_hours": profile.get("weekly_time_hours"),
        "constraints": profile.get("constraints", []),
        "dominant_style": ls.get("dominant_style") if ls else None,
        "vark_scores": ls.get("scores") if ls else None,
        "vark_raw_string": (ls.get("raw_string") or profile.get("vark_raw_string")) if ls or "vark_raw_string" in profile else None,
    }
    result = db.table("learner_profiles").insert(payload).execute()
    return _map_profile_row(result.data[0])


def get_learner_profile(profile_id: str) -> dict[str, Any] | None:
    db = get_supabase()
    result = db.table("learner_profiles").select("*").eq("id", profile_id).limit(1).execute()
    return _map_profile_row(result.data[0]) if result.data else None


def update_learner_profile(profile_id: str, updates: dict[str, Any]) -> dict[str, Any] | None:
    db = get_supabase()
    db_updates = {**updates}
    if "learning_style" in db_updates:
        ls = db_updates.pop("learning_style")
        if ls:
            db_updates["dominant_style"] = ls.get("dominant_style")
            db_updates["vark_scores"] = ls.get("scores")
            if "raw_string" in ls:
                db_updates["vark_raw_string"] = ls.get("raw_string")
        else:
            db_updates["dominant_style"] = None
            db_updates["vark_scores"] = None
            db_updates["vark_raw_string"] = None

    if "vark_raw_string" in db_updates:
        db_updates["vark_raw_string"] = db_updates.pop("vark_raw_string")

    result = db.table("learner_profiles").update(db_updates).eq("id", profile_id).execute()
    return _map_profile_row(result.data[0]) if result.data else None


# ---- roadmaps -------------------------------------------------------------


def create_roadmap(learner_profile_id: str, version: int = 1) -> dict[str, Any]:
    db = get_supabase()
    result = (
        db.table("roadmaps")
        .insert({"learner_profile_id": learner_profile_id, "version": version})
        .execute()
    )
    return result.data[0]


def get_roadmap(roadmap_id: str) -> dict[str, Any] | None:
    db = get_supabase()
    result = db.table("roadmaps").select("*").eq("id", roadmap_id).limit(1).execute()
    return result.data[0] if result.data else None


def get_latest_roadmap_for_profile(learner_profile_id: str) -> dict[str, Any] | None:
    db = get_supabase()
    result = (
        db.table("roadmaps")
        .select("*")
        .eq("learner_profile_id", learner_profile_id)
        .order("version", desc=True)
        .limit(1)
        .execute()
    )
    return result.data[0] if result.data else None


def get_all_roadmaps_for_learner(learner_id: str) -> list[dict[str, Any]]:
    db = get_supabase()
    try:
        profiles_res = (
            db.table("learner_profiles")
            .select("*")
            .eq("learner_id", learner_id)
            .order("created_at", desc=True)
            .execute()
        )
        profiles = profiles_res.data or []
    except Exception as exc:
        print(f"[get_all_roadmaps_for_learner] profiles fetch error: {exc}")
        profiles = []

    if not profiles:
        return []

    profile_map = {p["id"]: _map_profile_row(p) for p in profiles}
    profile_ids = list(profile_map.keys())

    try:
        roadmaps_res = (
            db.table("roadmaps")
            .select("*")
            .order("version", desc=True)
            .execute()
        )
        all_roadmaps = roadmaps_res.data or []
        roadmaps = [r for r in all_roadmaps if r.get("learner_profile_id") in profile_ids]
    except Exception as exc:
        print(f"[get_all_roadmaps_for_learner] roadmaps fetch error: {exc}")
        roadmaps = []

    if not roadmaps:
        return []

    # Deduplicate: only take the latest roadmap version for each learner_profile_id
    latest_roadmaps_by_profile: dict[str, dict[str, Any]] = {}
    for r in roadmaps:
        pid = r["learner_profile_id"]
        if pid not in latest_roadmaps_by_profile:
            latest_roadmaps_by_profile[pid] = r
        else:
            existing_ver = latest_roadmaps_by_profile[pid].get("version", 1)
            new_ver = r.get("version", 1)
            if new_ver > existing_ver:
                latest_roadmaps_by_profile[pid] = r

    distinct_roadmaps = list(latest_roadmaps_by_profile.values())

    catalog = []
    try:
        catalog = get_all_courses()
    except Exception:
        pass

    if not catalog:
        try:
            from pathlib import Path
            cat_path = Path(__file__).resolve().parents[3] / "recommender" / "catalog" / "catalog.json"
            if cat_path.exists():
                import json
                with open(cat_path, "r", encoding="utf-8") as f:
                    catalog = json.load(f)
        except Exception:
            catalog = []

    catalog_map = {c["id"]: c for c in catalog}
    completed_res_ids = get_completed_resource_ids_for_learner(learner_id)

    results = []
    for r in distinct_roadmaps:
        try:
            items_res = (
                db.table("roadmap_items")
                .select("*")
                .eq("roadmap_id", r["id"])
                .order("order")
                .execute()
            )
            items = items_res.data or []
        except Exception as exc:
            print(f"[get_all_roadmaps_for_learner] items fetch error: {exc}")
            items = []

        total_items = len(items)
        completed_items = sum(
            1 for it in items
            if it.get("status") in ("completed", "skipped") or it.get("resource_id") in completed_res_ids
        )

        total_hours = sum(
            (catalog_map.get(it.get("resource_id"), {}).get("duration_hours", 4))
            for it in items
        )
        completed_hours = sum(
            (catalog_map.get(it.get("resource_id"), {}).get("duration_hours", 4))
            for it in items
            if it.get("status") in ("completed", "skipped") or it.get("resource_id") in completed_res_ids
        )

        pct = round((completed_items / total_items * 100)) if total_items > 0 else 0
        profile_info = profile_map.get(r["learner_profile_id"]) or {}

        results.append({
            "id": r["id"],
            "roadmap_id": r["id"],
            "learner_profile_id": r["learner_profile_id"],
            "version": r.get("version", 1),
            "created_at": r.get("created_at"),
            "goal": profile_info.get("goal", "Goal Pathway"),
            "goal_type": profile_info.get("goal_type", "job"),
            "experience_level": profile_info.get("experience_level", "intermediate"),
            "weekly_time_hours": profile_info.get("weekly_time_hours", 10),
            "timeline_months": profile_info.get("timeline_months", 6),
            "total_items": total_items,
            "completed_items": completed_items,
            "total_hours": total_hours,
            "completed_hours": completed_hours,
            "percentage": pct,
            "is_completed": total_items > 0 and completed_items == total_items,
        })

    return results


# ---- roadmap_items ----------------------------------------------------


def bulk_create_roadmap_items(roadmap_id: str, items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """items: [{resource_id, order, status, milestone, reason}, ...]"""
    db = get_supabase()
    payload = [{**item, "roadmap_id": roadmap_id} for item in items]
    result = db.table("roadmap_items").insert(payload).execute()
    return result.data


def get_roadmap_items(roadmap_id: str) -> list[dict[str, Any]]:
    db = get_supabase()
    result = (
        db.table("roadmap_items")
        .select("*")
        .eq("roadmap_id", roadmap_id)
        .order("order")
        .execute()
    )
    return result.data


def get_roadmap_item(roadmap_item_id: str) -> dict[str, Any] | None:
    db = get_supabase()
    result = db.table("roadmap_items").select("*").eq("id", roadmap_item_id).limit(1).execute()
    return result.data[0] if result.data else None


def get_completed_resource_ids_for_learner(learner_id: str) -> set[str]:
    """Returns the set of all resource_ids completed across all roadmaps for this learner."""
    db = get_supabase()
    try:
        profiles_res = (
            db.table("learner_profiles")
            .select("id")
            .eq("learner_id", learner_id)
            .execute()
        )
        profile_ids = [p["id"] for p in (profiles_res.data or [])]
        if not profile_ids:
            return set()

        roadmaps_res = db.table("roadmaps").select("id, learner_profile_id").execute()
        all_roadmaps = roadmaps_res.data or []
        roadmap_ids = [r["id"] for r in all_roadmaps if r.get("learner_profile_id") in profile_ids]
        if not roadmap_ids:
            return set()

        items_res = (
            db.table("roadmap_items")
            .select("resource_id, status, roadmap_id")
            .execute()
        )
        all_items = items_res.data or []
        return {
            it["resource_id"]
            for it in all_items
            if it.get("roadmap_id") in roadmap_ids and it.get("status") == "completed"
        }
    except Exception as exc:
        print(f"[get_completed_resource_ids_for_learner] error: {exc}")
        return set()


def update_roadmap_item_status(roadmap_item_id: str, status: str) -> dict[str, Any] | None:
    db = get_supabase()
    result = db.table("roadmap_items").update({"status": status}).eq("id", roadmap_item_id).execute()
    updated_row = result.data[0] if result.data else None

    # If marked completed, permanently mark this resource completed across ALL roadmaps for this learner!
    if updated_row and status == "completed":
        try:
            res_id = updated_row.get("resource_id")
            roadmap_id = updated_row.get("roadmap_id")
            roadmap_row = get_roadmap(roadmap_id)
            if roadmap_row and roadmap_row.get("learner_profile_id"):
                prof = get_learner_profile(roadmap_row["learner_profile_id"])
                if prof and prof.get("learner_id"):
                    learner_id = prof["learner_id"]
                    # Find all roadmaps for this learner
                    prof_res = db.table("learner_profiles").select("id").eq("learner_id", learner_id).execute()
                    p_ids = [p["id"] for p in (prof_res.data or [])]
                    if p_ids:
                        all_rms = db.table("roadmaps").select("id, learner_profile_id").execute().data or []
                        target_rm_ids = [r["id"] for r in all_rms if r.get("learner_profile_id") in p_ids]
                        for rm_id in target_rm_ids:
                            db.table("roadmap_items").update({"status": "completed"}).eq("roadmap_id", rm_id).eq("resource_id", res_id).execute()
        except Exception as sync_exc:
            print(f"[update_roadmap_item_status] cross-roadmap sync note: {sync_exc}")

    return updated_row


# ---- feedback -----------------------------------------------------------


def create_feedback(roadmap_item_id: str, action: str, note: str | None) -> dict[str, Any]:
    db = get_supabase()
    result = (
        db.table("feedback")
        .insert({"roadmap_item_id": roadmap_item_id, "action": action, "note": note})
        .execute()
    )
    return result.data[0]
