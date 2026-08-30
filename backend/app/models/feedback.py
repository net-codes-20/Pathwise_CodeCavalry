"""backend/app/models/feedback.py — Pydantic models mirroring contracts/feedback.schema.json"""

from __future__ import annotations

from enum import Enum

from pydantic import BaseModel


class FeedbackAction(str, Enum):
    complete = "complete"
    skip = "skip"


class FeedbackRequest(BaseModel):
    roadmap_item_id: str
    action: FeedbackAction
    note: str | None = None


class FeedbackResponse(BaseModel):
    feedback_id: str
    updated_item_status: str
    progress_percent: float
    replan_recommended: bool


class ExplainRequest(BaseModel):
    roadmap_item_id: str


class ExplainResponse(BaseModel):
    explanation: str
