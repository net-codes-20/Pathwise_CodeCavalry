"""
ai/prompts/explain_item.py — Grounded Item Explanation Prompt

Generates the "Why this?" explanation for a single roadmap item, grounded in
that specific learner's profile and that specific resource's content — never
generic text. Called by POST /api/roadmap/{id}/explain.
"""

from __future__ import annotations

from typing import Any

from ai.client import ai_client

_SYSTEM_PROMPT = """You are the explanation step of an AI learning mentor.

Given a learner profile and one roadmap item (a specific resource + its
position/reason in their roadmap), write a short "Why this?" explanation the
learner will read in the UI.

Rules:
- 2-4 sentences.
- MUST reference specific fields from the profile (their stated goal,
  current skills, experience level, timeline, or learning style) — not generic language.
- MUST reference specific content from the resource (its title, level, or
  description) — not generic language.
- Do not invent facts about the resource beyond what's given.
- Plain, encouraging, second-person tone ("you already know X, so this...").

Respond with ONLY a single JSON object, no markdown fences, no commentary:
{ "explanation": "string, 2-4 sentences" }
"""


def explain_item(profile: dict[str, Any], resource: dict[str, Any], roadmap_item: dict[str, Any]) -> dict[str, Any]:
    """
    profile: contracts/learner_profile.schema.json
    resource: contracts/resource.schema.json (the catalog item this roadmap_item points to)
    roadmap_item: contracts/roadmap_item.schema.json (includes the "reason" set at generation time)
    """
    user_prompt = f"""LEARNER PROFILE:
{profile}

RESOURCE:
{resource}

ROADMAP CONTEXT (order in path, original generation reason):
order={roadmap_item.get('order')}, milestone={roadmap_item.get('milestone')}, generation_reason="{roadmap_item.get('reason')}"

Write the "Why this?" explanation now."""

    try:
        result = ai_client.generate_json(_SYSTEM_PROMPT, user_prompt)
        _validate(result)
        return result
    except Exception as exc:
        print(f"[explain_item] AI generation error: {exc}. Generating grounded fallback explanation.")
        reason = roadmap_item.get("reason", "")
        goal = profile.get("goal", "your career goals")
        exp = profile.get("experience_level", "current")
        title = resource.get("title", "this module")
        level = resource.get("level", "foundational")
        dur = resource.get("duration_hours", 4)
        style = profile.get("learning_style", {}).get("dominant_style", "hands-on")
        
        fallback_text = (
            f"This {level}-level module on \"{title}\" ({dur}h) was selected for your {exp} pathway to help you achieve your goal of '{goal}'. "
            f"It aligns with your {style} learning preference and builds the essential prerequisites for your subsequent roadmap milestones. "
            f"{reason if reason else 'Completing this activity reinforces practical core competencies.'}"
        )
        return {"explanation": fallback_text}


def _validate(result: dict[str, Any]) -> None:
    explanation = result.get("explanation")
    if not isinstance(explanation, str) or not explanation.strip():
        raise ValueError("Response missing non-empty 'explanation'")
