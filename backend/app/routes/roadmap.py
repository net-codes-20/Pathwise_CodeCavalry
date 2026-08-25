"""backend/app/routes/roadmap.py"""

from fastapi import APIRouter, HTTPException

from app.db import queries
from app.models.feedback import ExplainRequest, FeedbackRequest
from app.models.roadmap import GenerateRoadmapRequest, ReplanRequest
from app.services import roadmap_service

router = APIRouter(prefix="/roadmap", tags=["roadmap"])


@router.post("/generate", status_code=201)
def generate(req: GenerateRoadmapRequest):
    try:
        roadmap = roadmap_service.generate_roadmap(req.profile_id)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail={"error": "roadmap_generation_failed", "detail": str(exc)}) from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=422, detail={"error": "roadmap_generation_failed", "detail": str(exc)}) from exc
    return {"roadmap": roadmap}


@router.get("/{roadmap_id}")
def get(roadmap_id: str):
    roadmap = roadmap_service.get_roadmap(roadmap_id)
    if roadmap is None:
        raise HTTPException(status_code=404, detail={"error": "roadmap_not_found"})
    return roadmap


@router.post("/{roadmap_id}/explain")
def explain(roadmap_id: str, req: ExplainRequest):
    roadmap = queries.get_roadmap(roadmap_id)
    if roadmap is None:
        raise HTTPException(status_code=404, detail={"error": "roadmap_not_found"})
    try:
        result = roadmap_service.explain_item(req.roadmap_item_id, roadmap["learner_profile_id"])
    except ValueError as exc:
        raise HTTPException(status_code=404, detail={"error": str(exc)}) from exc
    except Exception as exc:
        raise HTTPException(status_code=422, detail={"error": "explain_failed", "detail": str(exc)}) from exc
    return result


@router.post("/{roadmap_id}/feedback")
def feedback(roadmap_id: str, req: FeedbackRequest):
    try:
        result = roadmap_service.submit_feedback(req.roadmap_item_id, req.action.value, req.note, roadmap_id)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return result


@router.post("/{roadmap_id}/replan")
def replan(roadmap_id: str, req: ReplanRequest = None):
    try:
        target_id = req.roadmap_id if (req and req.roadmap_id) else roadmap_id
        result = roadmap_service.replan_roadmap(target_id)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail={"error": "replan_failed", "detail": str(exc)}) from exc
    except Exception as exc:
        raise HTTPException(status_code=422, detail={"error": "replan_failed", "detail": str(exc)}) from exc
    return result
