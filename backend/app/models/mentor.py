"""backend/app/models/mentor.py"""

from __future__ import annotations
from pydantic import BaseModel


class MentorChatRequest(BaseModel):
    message: str
    learner_profile_id: str | None = None
    roadmap_id: str | None = None
    current_item_id: str | None = None


class MentorChatResponse(BaseModel):
    reply: str
