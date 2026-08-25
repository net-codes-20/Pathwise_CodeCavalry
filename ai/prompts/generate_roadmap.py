"""
ai/prompts/generate_roadmap.py — Grounded Roadmap Generation & Sequencing

Turns (learner_profile, candidate resources from recommender/ranking.py)
into an ordered, personalized roadmap. MUST only use resource_ids present
in the candidate set — this is the core "grounding" guardrail from the spec
(Section 11: never invent resource IDs or titles).

Called by backend/app/services/roadmap_service.py via POST /api/roadmap/generate,
after backend calls recommender.ranking.get_candidates(profile).
"""

from __future__ import annotations

from typing import Any

from ai.client import ai_client

_SYSTEM_PROMPT = """You are the roadmap-generation step of an AI learning mentor.

You will receive a learner profile and a list of CANDIDATE resources (already
retrieved and ranked by a separate retrieval system). Your job is to select
and SEQUENCE a subset of these candidates into a coherent, personalized
learning roadmap.

STRICT RULES:
1. Every "resource_id" you output MUST be one of the ids in the candidate list.
   Never invent a resource id or title. If nothing suitable exists, return
   fewer items rather than inventing one.
2. Respect prerequisite order: a resource whose prerequisites aren't in the
   catalog's known-satisfied set should come after items that satisfy them,
   where those prerequisite items are also in your selection.
3. Sequence from the learner's current level toward their goal — order matters.
4. Mark realistic milestones (roughly one per 3-6 items, or after a
   significant project/assessment) as "milestone": true.
5. Every item's "reason" must be 1-2 sentences and reference the SPECIFIC
   learner profile (their goal, stated skills, timeline, or learning style)
   and the SPECIFIC resource content — never generic filler like "this will help
   you learn". If they have a preferred learning style, explain how the resource
   type (e.g. video for visual, project for kinesthetic) fits their style.
6. Keep the roadmap achievable: use timeline_months and weekly_time_hours to
   judge how many items/hours are reasonable — don't just dump the whole list.

Respond with ONLY a single JSON object, no markdown fences, no commentary:
{
  "items": [
    {
      "resource_id": "string, must exist in the candidate list",
      "order": number (1-indexed, sequence position),
      "milestone": boolean,
      "reason": "string, 1-2 sentences, grounded in this learner + this resource"
    }
  ]
}
"""


def generate_roadmap(profile: dict[str, Any], candidates: list[dict[str, Any]]) -> dict[str, Any]:
    """
    profile: matches contracts/learner_profile.schema.json
    candidates: output of recommender.ranking.get_candidates(profile) —
                full resource objects, "_score"/"_prereqs_met" are fine to
                include, the model can ignore them.
    """
    candidate_ids = {c["id"] for c in candidates}

    user_prompt = _build_user_prompt(profile, candidates)
    try:
        result = ai_client.generate_json(_SYSTEM_PROMPT, user_prompt)
        _validate(result, candidate_ids)
        return result
    except Exception as exc:
        print(f"[generate_roadmap] AI generation error: {exc}. Generating deterministic grounded fallback.")
        level_order = {"beginner": 0, "intermediate": 1, "advanced": 2}
        sorted_candidates = sorted(
            candidates[:12],
            key=lambda c: (
                level_order.get(c.get("level", "intermediate"), 1),
                len(c.get("prerequisites", [])),
            ),
        )
        goal = profile.get("goal", "your career goals")
        style = profile.get("learning_style", {}).get("dominant_style", "hands-on")
        items = []
        for idx, c in enumerate(sorted_candidates):
            items.append({
                "resource_id": c["id"],
                "order": idx + 1,
                "milestone": idx == 0 or idx == len(sorted_candidates) - 1 or c.get("type") in ("project", "assessment"),
                "reason": f"Covers {c.get('title')} in {c.get('domain', 'the domain').replace('_', ' ')} to advance toward '{goal}' matching your {style} learning preference.",
            })
        return {"items": items}


def _build_user_prompt(profile: dict[str, Any], candidates: list[dict[str, Any]]) -> str:
    candidate_lines = []
    for c in candidates:
        candidate_lines.append(
            f"- id={c['id']} | title=\"{c['title']}\" | domain={c['domain']} | level={c['level']} "
            f"| type={c['type']} | duration_hours={c['duration_hours']} "
            f"| prerequisites={c.get('prerequisites', [])} | tags={c.get('tags', [])} "
            f"| description=\"{c['description']}\""
        )
    candidates_block = "\n".join(candidate_lines)

    return f"""LEARNER PROFILE:
{profile}

CANDIDATE RESOURCES (select and sequence only from this list):
{candidates_block}

Build the personalized roadmap now, following the system rules exactly."""


def _validate(result: dict[str, Any], candidate_ids: set[str]) -> None:
    items = result.get("items")
    if not isinstance(items, list) or not items:
        raise ValueError("Response missing non-empty 'items' list")

    seen_orders = set()
    for item in items:
        if item.get("resource_id") not in candidate_ids:
            raise ValueError(
                f"Model invented or used an out-of-candidate resource_id: {item.get('resource_id')}"
            )
        if not isinstance(item.get("reason"), str) or not item["reason"].strip():
            raise ValueError(f"Item {item.get('resource_id')} missing a grounded 'reason'")
        order = item.get("order")
        if order in seen_orders:
            raise ValueError(f"Duplicate order value: {order}")
        seen_orders.add(order)
