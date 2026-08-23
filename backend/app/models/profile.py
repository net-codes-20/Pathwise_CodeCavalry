"""backend/app/models/profile.py — Pydantic models mirroring contracts/learner_profile.schema.json"""

from __future__ import annotations

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class GoalType(str, Enum):
    internship = "internship"
    job = "job"
    new_skill = "new_skill"
    project = "project"
    interview_prep = "interview_prep"
    academic = "academic"
    career_transition = "career_transition"
    certification = "certification"


class ExperienceLevel(str, Enum):
    beginner = "beginner"
    intermediate = "intermediate"
    advanced = "advanced"


class VarkScores(BaseModel):
    visual: int
    auditory: int
    read_write: int
    kinesthetic: int


class LearningStyle(BaseModel):
    dominant_style: str
    scores: VarkScores
    raw_string: str | None = None


class LearnerProfileBase(BaseModel):
    goal: str
    goal_type: GoalType
    experience_level: ExperienceLevel
    current_skills: list[str] = Field(default_factory=list)
    interests: list[str] = Field(default_factory=list)
    timeline_months: float | None = None
    weekly_time_hours: float | None = None
    constraints: list[str] = Field(default_factory=list)
    learning_style: LearningStyle | None = None
    vark_raw_string: str | None = None


class LearnerProfileCreate(LearnerProfileBase):
    learner_id: str


class LearnerProfileUpdate(BaseModel):
    goal: str | None = None
    goal_type: GoalType | None = None
    experience_level: ExperienceLevel | None = None
    current_skills: list[str] | None = None
    interests: list[str] | None = None
    timeline_months: float | None = None
    weekly_time_hours: float | None = None
    constraints: list[str] | None = None
    learning_style: LearningStyle | None = None


class VarkAnswer(BaseModel):
    question_id: str
    selected_option: str


class VarkAssessmentRequest(BaseModel):
    learner_id: str
    answers: list[VarkAnswer]


class VarkAssessmentResponse(BaseModel):
    learning_style: LearningStyle


class LearnerProfile(LearnerProfileBase):
    id: str
    learner_id: str
    created_at: datetime
    updated_at: datetime


class ParseProfileRequest(BaseModel):
    learner_id: str
    raw_text: str


class ParseProfileResponse(BaseModel):
    profile: LearnerProfileBase
    missing_fields: list[str]
    follow_up_question: str | None
