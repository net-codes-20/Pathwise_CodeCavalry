"""
ai/prompts/replan.py — Adaptive Roadmap Re-planning & Sequencing

Regenerates the REMAINING (not-yet-completed/skipped) part of a roadmap after
learner feedback (complete/skip), grounded only in a fresh candidate set from
recommender/ranking.py. Called by POST /api/roadmap/{id}/replan, after the
backend creates a new `roadmaps` row (version + 1) per Section 7's versioning
rule and copies forward completed/skipped items unchanged.
"""

from __future__ import annotations

from typing import Any

from ai.client import ai_client

_SYSTEM_PROMPT = """You are the re-planning step of an AI learning mentor.

The learner has made progress: some roadmap items are now "completed" or
"skipped". Your job is to regenerate ONLY the remaining upcoming items,
adjusting for what actually happened — skipped items may mean the learner
wants to move faster or the item didn't fit; completed items confirm the
learner has that ground covered.

STRICT RULES (same as roadmap generation):
1. Every "resource_id" you output MUST be one of the ids in the candidate list.
   Never invent a resource id or title.
2. Do not re-include resource_ids that are already marked completed or skipped
   in the history provided — those are finalized and copied forward separately.
3. Respect prerequisites and sequence from where the learner actually is now.
4. Each item needs a grounded 1-2 sentence "reason".
5. Also write "changes_summary": 1-3 plain-language sentences a learner can
   read describing what changed in their path and why (e.g. "Since you skipped
   X, we moved Y earlier and added Z to reinforce prerequisites.").

Respond with ONLY a single JSON object, no markdown fences, no commentary:
{
  "items": [
    { "resource_id": "string", "order": number, "milestone": boolean, "reason": "string" }
  ],
  "changes_summary": "string"
}
"""


def replan(
    profile: dict[str, Any],
    history: list[dict[str, Any]],
    candidates: list[dict[str, Any]],
) -> dict[str, Any]:
    """
    profile: contracts/learner_profile.schema.json
    history: prior roadmap_items with their final status ("completed"/"skipped"),
             each including its resource_id and title for context.
    candidates: fresh output of recommender.ranking.get_candidates(profile,
                completed_ids={...}) — excludes/deprioritizes what's already done.
    """
    candidate_ids = {c["id"] for c in candidates}
    completed_or_skipped_ids = {h["resource_id"] for h in history if h["status"] in ("completed", "skipped")}

    try:
        user_prompt = _build_user_prompt(profile, history, candidates)
        result = ai_client.generate_json(_SYSTEM_PROMPT, user_prompt)
        _validate(result, candidate_ids, completed_or_skipped_ids)
        return result
    except Exception as exc:
        print(f"[replan] AI generation error: {exc}. Generating deterministic replanned fallback.")
        available_candidates = [c for c in candidates if c["id"] not in completed_or_skipped_ids]
        if len(available_candidates) < 6:
            from recommender.ranking import _infer_domains, _load_catalog
            cat = _load_catalog(None)
            domains = _infer_domains(profile)
            domain_items = [c for c in cat if (not domains or c.get("domain") in domains) and c["id"] not in completed_or_skipped_ids]
            other_items = [c for c in cat if c["id"] not in completed_or_skipped_ids and c not in domain_items]
            available_candidates = domain_items + other_items

        if not available_candidates:
            from recommender.ranking import _load_catalog
            cat = _load_catalog(None)
            available_candidates = cat[:8]

        completed_count = len([h for h in history if h.get("status") == "completed"])
        # If learner has completed courses, upgrade level priority to intermediate/advanced
        if completed_count >= 2:
            level_order = {"intermediate": 0, "advanced": 1, "beginner": 2}
        elif completed_count >= 1:
            level_order = {"beginner": 1, "intermediate": 0, "advanced": 2}
        else:
            level_order = {"beginner": 0, "intermediate": 1, "advanced": 2}

        # Sort all available candidates by level progression and prerequisites
        sorted_all = sorted(
            available_candidates,
            key=lambda c: (
                level_order.get(c.get("level", "intermediate"), 1),
                1 if c.get("type") in ("project", "assessment") else 0,
                len(c.get("prerequisites", [])),
            ),
        )

        chosen = sorted_all[:8]
        goal = profile.get("target_role") or profile.get("goal") or "your target career path"
        items = []
        for idx, c in enumerate(chosen):
            items.append({
                "resource_id": c["id"],
                "order": idx + 1,
                "milestone": idx == len(chosen) - 1 or c.get("type") in ("project", "assessment"),
                "reason": f"Progressive milestone in {c.get('title')} ({c.get('level')}) advancing you toward '{goal}'.",
            })
        return {
            "items": items,
            "changes_summary": "Your learning roadmap has been adapted with upgraded modules and milestones based on your latest competencies.",
        }


def _build_user_prompt(
    profile: dict[str, Any],
    history: list[dict[str, Any]],
    candidates: list[dict[str, Any]],
) -> str:
    history_lines = [
        f"- resource_id={h['resource_id']} | status={h['status']} | title=\"{h.get('title', '')}\""
        for h in history
    ]
    candidate_lines = [
        f"- id={c['id']} | title=\"{c['title']}\" | domain={c['domain']} | level={c['level']} "
        f"| type={c['type']} | duration_hours={c['duration_hours']} "
        f"| prerequisites={c.get('prerequisites', [])} | description=\"{c['description']}\""
        for c in candidates
    ]

    return f"""LEARNER PROFILE:
{profile}

ROADMAP HISTORY SO FAR (do not repeat completed/skipped resource_ids):
{chr(10).join(history_lines)}

FRESH CANDIDATE RESOURCES (select and sequence remaining items only from this list):
{chr(10).join(candidate_lines)}

Re-plan the remaining roadmap now, following the system rules exactly."""


def _validate(result: dict[str, Any], candidate_ids: set[str], completed_or_skipped_ids: set[str]) -> None:
    items = result.get("items")
    if not isinstance(items, list):
        raise ValueError("Response missing 'items' list")

    for item in items:
        rid = item.get("resource_id")
        if rid not in candidate_ids:
            raise ValueError(f"Model invented or used an out-of-candidate resource_id: {rid}")
        if rid in completed_or_skipped_ids:
            raise ValueError(f"Model re-included an already completed/skipped resource_id: {rid}")
        if not isinstance(item.get("reason"), str) or not item["reason"].strip():
            raise ValueError(f"Item {rid} missing a grounded 'reason'")

    if not isinstance(result.get("changes_summary"), str) or not result["changes_summary"].strip():
        raise ValueError("Response missing non-empty 'changes_summary'")
