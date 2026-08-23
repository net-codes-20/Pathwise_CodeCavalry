"""backend/app/routes/health.py — Person E relies on this for deploy smoke tests."""

from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
def health():
    return {"status": "ok"}
