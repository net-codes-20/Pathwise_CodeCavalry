"""backend/app/routes/learner.py"""

from fastapi import APIRouter, HTTPException

from app.db import queries
from app.models.learner import (
    LearnerAccountUpdateRequest,
    LearnerStartRequest,
    LearnerStartResponse,
    LearnerThemeUpdateRequest,
)

router = APIRouter(prefix="/learner", tags=["learner"])


@router.post("/start", response_model=LearnerStartResponse)
def start(req: LearnerStartRequest):
    username = req.username.strip().lower()
    existing = queries.find_learner_by_username(username)
    learner_theme = "light"
    learner_name = req.name.strip()

    if existing:
        # LOGIN: verify password
        if not queries.verify_learner_password(existing, req.password):
            raise HTTPException(status_code=401, detail="Incorrect password.")
        learner_id = existing["id"]
        learner_theme = existing.get("theme", "light") or "light"
        learner_name = existing.get("name", learner_name)
    else:
        # REGISTER: create new account
        row = queries.create_learner_with_credentials(req.name.strip(), username, req.password)
        learner_id = row["id"]
        learner_theme = row.get("theme", "light") or "light"

    # Session restoration — look up the learner's latest profile and roadmap
    profile = queries.get_latest_profile_for_learner(learner_id)
    profile_id = profile["id"] if profile else None

    roadmap = None
    roadmap_id = None
    if profile_id:
        roadmap = queries.get_latest_roadmap_for_profile(profile_id)
        roadmap_id = roadmap["id"] if roadmap else None

    return LearnerStartResponse(
        learner_id=learner_id,
        name=learner_name,
        theme=learner_theme,
        has_profile=profile_id is not None,
        profile_id=profile_id,
        has_roadmap=roadmap_id is not None,
        roadmap_id=roadmap_id,
    )


@router.patch("/{learner_id}/theme")
def update_theme(learner_id: str, req: LearnerThemeUpdateRequest):
    theme = req.theme.lower().strip()
    if theme not in ("light", "dark", "system"):
        theme = "light"
    updated = queries.update_learner_theme(learner_id, theme)
    return {"ok": True, "learner_id": learner_id, "theme": theme}


@router.patch("/{learner_id}/account")
def update_account(learner_id: str, req: LearnerAccountUpdateRequest):
    updated = queries.update_learner_account(learner_id, name=req.name, password=req.password)
    if updated is None:
        raise HTTPException(status_code=400, detail="Could not update account credentials.")
    return {"ok": True, "name": updated.get("name")}


@router.get("/{learner_id}/roadmaps")
def get_roadmaps(learner_id: str):
    roadmaps = queries.get_all_roadmaps_for_learner(learner_id)
    return {"roadmaps": roadmaps}

