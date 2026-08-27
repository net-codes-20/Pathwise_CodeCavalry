"""backend/app/routes/mentor.py"""

from __future__ import annotations

import sys
from pathlib import Path
from fastapi import APIRouter

_REPO_ROOT = Path(__file__).resolve().parents[3]
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))

from ai.prompts.mentor_chat import answer_mentor_query  # noqa: E402
from app.db import queries  # noqa: E402
from app.models.mentor import MentorChatRequest, MentorChatResponse  # noqa: E402
from app.services.roadmap_service import _load_catalog, _resource_by_id  # noqa: E402

router = APIRouter(prefix="/mentor", tags=["mentor"])


@router.post("/chat", response_model=MentorChatResponse)
def chat(req: MentorChatRequest):
    profile = None
    if req.learner_profile_id:
        profile = queries.get_learner_profile(req.learner_profile_id)

    roadmap = None
    completed_items = []
    upcoming_items = []
    current_item = None
    catalog = _load_catalog()

    if req.roadmap_id:
        roadmap = queries.get_roadmap(req.roadmap_id)
        if roadmap and not profile and roadmap.get("learner_profile_id"):
            profile = queries.get_learner_profile(roadmap["learner_profile_id"])

        items = queries.get_roadmap_items(req.roadmap_id)
        expanded_items = [
            {**it, "resource": _resource_by_id(it.get("resource_id"), catalog)}
            for it in items
        ]

        # Check global learner completions
        global_completed_ids = set()
        if profile and profile.get("learner_id"):
            global_completed_ids = queries.get_completed_resource_ids_for_learner(profile["learner_id"])

        completed_items = [
            it for it in expanded_items
            if it.get("status") == "completed" or it.get("resource_id") in global_completed_ids
        ]
        upcoming_items = [
            it for it in expanded_items
            if it.get("status") == "upcoming" and it.get("resource_id") not in global_completed_ids
        ]

        # Find active item if not specified
        for it in expanded_items:
            if it.get("status") in ("current", "in_progress") and it.get("resource_id") not in global_completed_ids:
                current_item = it
                break

        if not current_item and upcoming_items:
            current_item = upcoming_items[0]

    # Override with specific item if requested
    if req.current_item_id:
        roadmap_item = queries.get_roadmap_item(req.current_item_id)
        if roadmap_item:
            res = _resource_by_id(roadmap_item.get("resource_id"), catalog)
            current_item = {**roadmap_item, "resource": res}

    reply_text = answer_mentor_query(
        message=req.message,
        profile=profile,
        roadmap=roadmap,
        current_item=current_item,
        completed_items=completed_items,
        upcoming_items=upcoming_items,
    )

    return MentorChatResponse(reply=reply_text)

