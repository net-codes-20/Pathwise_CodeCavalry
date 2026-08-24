"""
ai/prompts/parse_profile.py — Natural Language Goal Parsing

Turns a learner's free-text goal description into a structured profile that
matches contracts/learner_profile.schema.json, matching the response shape
in ai/schemas/learner_profile_extraction.schema.json.

Called by backend/app/services/profile_service.py via POST /api/profile/parse.
"""

from __future__ import annotations

from typing import Any

from ai.client import ai_client

_VALID_GOAL_TYPES = [
    "internship", "job", "new_skill", "project", "interview_prep",
    "academic", "career_transition", "certification",
]
_VALID_LEVELS = ["beginner", "intermediate", "advanced"]

_SYSTEM_PROMPT = f"""You are the profile-extraction step of an AI learning mentor.

Extract a structured learner profile from the learner's free-text description
of their goal. Respond with ONLY a single JSON object matching this shape,
no markdown fences, no commentary:

{{
  "profile": {{
    "goal": "string, the learner's goal in their own words, cleaned up",
    "goal_type": "one of {_VALID_GOAL_TYPES}",
    "experience_level": "one of {_VALID_LEVELS}",
    "current_skills": ["string", ...],
    "interests": ["string", ...],
    "timeline_months": number or null if not mentioned,
    "weekly_time_hours": number or null if not mentioned,
    "constraints": ["string", ...]
  }},
  "missing_fields": ["field names that were not mentioned and matter for planning"],
  "follow_up_question": "one short, specific question to ask if missing_fields is non-empty, else null"
}}

Rules:
- Only ever pick goal_type and experience_level from the allowed lists above.
- If experience_level isn't stated, infer conservatively from context (default "beginner" if genuinely unclear).
- Convert daily budgets to weekly ones: if the learner says '2 hours per day' or '2h/day', set weekly_time_hours to 14 (2 * 7).
- ONLY flag timeline_months or weekly_time_hours in missing_fields if they are completely unstated.
- If timeline_months or weekly_time_hours are missing, ask ONE short, friendly follow_up_question for the missing info.
- If the learner ALREADY provided their goal, timeline, or weekly time (or if no critical fields are missing), missing_fields MUST be [] and follow_up_question MUST be null.
- NEVER ask repeat or unnecessary questions about target company, salary, or team.
"""


def parse_profile(raw_text: str, prior_answers: str | None = None) -> dict[str, Any]:
    """
    raw_text: the learner's free-text goal input (and/or their answer to a
              previous follow_up_question, concatenated by the caller per
              the onboarding flow in Section 8 of the spec).
    prior_answers: optional extra context if the frontend re-submits combined text.
    """
    user_prompt = raw_text if not prior_answers else f"{raw_text}\n\nAdditional context: {prior_answers}"
    try:
        result = ai_client.generate_json(_SYSTEM_PROMPT, user_prompt)
        _validate(result)
        return result
    except Exception as exc:
        print(f"[parse_profile] AI generation error: {exc}. Using fallback parser.")
        lower = raw_text.lower()
        level = (
            "advanced"
            if "advanced" in lower or "senior" in lower or "expert" in lower
            else "intermediate"
            if "intermediate" in lower or "some" in lower or "basic" in lower
            else "beginner"
        )
        goal_type = (
            "job"
            if "job" in lower or "career" in lower or "employment" in lower
            else "internship"
            if "intern" in lower
            else "project"
            if "project" in lower or "build" in lower
            else "new_skill"
        )
        return {
            "profile": {
                "goal": raw_text.strip()[:250],
                "goal_type": goal_type,
                "experience_level": level,
                "current_skills": [],
                "interests": [],
                "timeline_months": 6,
                "weekly_time_hours": 10,
                "constraints": [],
            },
            "missing_fields": [],
            "follow_up_question": None,
        }


def _validate(result: dict[str, Any]) -> None:
    profile = result.get("profile", {})
    if profile.get("goal_type") not in _VALID_GOAL_TYPES:
        raise ValueError(f"Invalid goal_type: {profile.get('goal_type')}")
    if profile.get("experience_level") not in _VALID_LEVELS:
        raise ValueError(f"Invalid experience_level: {profile.get('experience_level')}")
    if "missing_fields" not in result:
        raise ValueError("Response missing 'missing_fields'")
    if "follow_up_question" not in result:
        raise ValueError("Response missing 'follow_up_question'")
