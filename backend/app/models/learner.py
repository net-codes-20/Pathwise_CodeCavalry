"""backend/app/models/learner.py"""

from __future__ import annotations

from pydantic import BaseModel


class LearnerStartRequest(BaseModel):
    name: str
    username: str
    password: str


class LearnerThemeUpdateRequest(BaseModel):
    theme: str


class LearnerAccountUpdateRequest(BaseModel):
    name: str | None = None
    password: str | None = None


class LearnerStartResponse(BaseModel):
    learner_id: str
    name: str | None = None
    theme: str = "light"
    has_profile: bool = False
    profile_id: str | None = None
    has_roadmap: bool = False
    roadmap_id: str | None = None

