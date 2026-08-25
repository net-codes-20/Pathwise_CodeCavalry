"""backend/app/routes/profile.py"""

from fastapi import APIRouter, HTTPException

from app.models.profile import (
    LearnerProfileCreate,
    LearnerProfileUpdate,
    ParseProfileRequest,
    ParseProfileResponse,
    VarkAssessmentRequest,
    VarkAssessmentResponse,
)
from app.services import profile_service

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("/vark/questions")
def get_vark_questions():
    try:
        from app.db import queries
        questions = queries.get_vark_questions()
        if questions and len(questions) > 0:
            return questions
    except Exception as exc:
        print(f"[vark] Supabase questions read note: {exc}, using json fallback.")

    import json
    from pathlib import Path
    json_path = Path(__file__).resolve().parents[3] / "data" / "vark_questions.json"
    if json_path.exists():
        with open(json_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return []


@router.post("/vark", response_model=VarkAssessmentResponse)
def score_vark(req: VarkAssessmentRequest):
    try:
        from app.services import vark_service
        answers_dict = [ans.model_dump() for ans in req.answers]
        style_result = vark_service.calculate_vark(answers_dict)
        return {"learning_style": style_result}
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"vark_scoring_failed: {exc}") from exc


@router.post("/parse", response_model=ParseProfileResponse)
def parse(req: ParseProfileRequest):
    try:
        result = profile_service.parse_profile(req.learner_id, req.raw_text)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=422, detail=f"profile_parse_failed: {exc}") from exc
    return result


@router.post("", status_code=201)
def create(req: LearnerProfileCreate):
    profile_fields = req.model_dump(exclude={"learner_id"})
    row = profile_service.persist_profile(req.learner_id, profile_fields)
    return {"profile_id": row["id"], "profile": row}


@router.get("/{profile_id}")
def get(profile_id: str):
    profile = profile_service.get_profile(profile_id)
    if profile is None:
        raise HTTPException(status_code=404, detail={"error": "profile_not_found"})
    return profile


@router.put("/{profile_id}")
def update(profile_id: str, req: LearnerProfileUpdate):
    updates = req.model_dump(exclude_none=True)
    updated = profile_service.update_profile(profile_id, updates)
    if updated is None:
        raise HTTPException(status_code=404, detail={"error": "profile_not_found"})
    return updated
