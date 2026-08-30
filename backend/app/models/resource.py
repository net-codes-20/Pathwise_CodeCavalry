"""backend/app/models/resource.py — Pydantic model mirroring contracts/resource.schema.json"""

from __future__ import annotations

from enum import Enum

from pydantic import BaseModel


class Domain(str, Enum):
    data_science = "data_science"
    web_development = "web_development"
    ai_ml = "ai_ml"


class ResourceLevel(str, Enum):
    beginner = "beginner"
    intermediate = "intermediate"
    advanced = "advanced"


class ResourceType(str, Enum):
    course = "course"
    article = "article"
    video = "video"
    project = "project"
    assessment = "assessment"
    book = "book"


class Resource(BaseModel):
    id: str
    title: str
    domain: Domain
    level: ResourceLevel
    type: ResourceType
    tags: list[str]
    prerequisites: list[str]
    duration_hours: float
    url: str
    description: str
