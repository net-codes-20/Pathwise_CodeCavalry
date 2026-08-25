"""backend/app/models/roadmap.py — Pydantic models mirroring contracts/roadmap*.schema.json"""

from __future__ import annotations

from datetime import datetime
from enum import Enum

from pydantic import BaseModel

from app.models.resource import Resource


class RoadmapItemStatus(str, Enum):
    upcoming = "upcoming"
    current = "current"
    completed = "completed"
    skipped = "skipped"


class RoadmapItem(BaseModel):
    id: str
    resource_id: str
    order: int
    status: RoadmapItemStatus
    milestone: bool
    reason: str


class RoadmapItemExpanded(RoadmapItem):
    """RoadmapItem with the full catalog resource attached — what GET /api/roadmap/{id} returns."""

    resource: Resource


class GenerateRoadmapRequest(BaseModel):
    profile_id: str


class Roadmap(BaseModel):
    id: str
    learner_profile_id: str
    version: int
    generated_at: datetime
    items: list[RoadmapItemExpanded]


class ReplanRequest(BaseModel):
    roadmap_id: str | None = None


class ReplanResponse(BaseModel):
    roadmap: Roadmap
    changes_summary: str

