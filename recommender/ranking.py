"""
recommender/ranking.py — Deterministic Candidate Retrieval & Ranking Engine

Deterministic tag/domain/level/prerequisite scoring over the static catalog.
No embeddings, no trained model — pure rule-based retrieval that GROUNDS the
LLM roadmap generator (ai/prompts/generate_roadmap.py must only choose from
what this module returns).

Public API:
    get_candidates(profile: dict, catalog: list[dict] | None = None,
                    top_k: int = 40) -> list[dict]

`profile` must match contracts/learner_profile.schema.json.
Each returned resource dict matches contracts/resource.schema.json, with an
extra "_score" field (float) attached for debugging/testing — strip it
before sending to the LLM/API if you want a clean contract object.
"""

from __future__ import annotations

import json
import os
from typing import Any

_CATALOG_PATH = os.path.join(os.path.dirname(__file__), "catalog", "catalog.json")

_LEVEL_ORDER = {"beginner": 0, "intermediate": 1, "advanced": 2}

# Very small keyword map from common goal_type/goal phrasing to domains.
# This is intentionally simple (MVP = deterministic, not ML) — extend the
# lists as real personas surface more phrasing during eval.
_DOMAIN_KEYWORDS = {
    "data_science": ["data scientist", "data science", "data analyst", "analytics", "statistics", "pandas", "numpy", "tableau", "bi"],
    "web_development": ["web dev", "web developer", "frontend", "front-end", "backend", "back-end", "full stack", "full-stack", "react", "website", "javascript", "html", "css", "next.js", "node"],
    "ai_ml": ["ai engineer", "machine learning", "ml engineer", "deep learning", "llm", "artificial intelligence", "nlp", "computer vision", "pytorch", "tensorflow", "langchain", "agent"],
    "devops": ["devops", "ci/cd", "ci-cd", "docker", "kubernetes", "k8s", "terraform", "ansible", "jenkins", "infrastructure", "pipeline", "sre"],
    "cloud": ["cloud", "aws", "azure", "gcp", "google cloud", "serverless", "cloud architecture", "solutions architect", "cloud practitioner"],
    "cybersecurity": ["cybersecurity", "security", "ethical hacking", "infosec", "penetration testing", "soc", "cryptography", "owasp", "network security", "vulnerability"],
    "mobile_development": ["mobile", "android", "ios", "react native", "flutter", "swift", "kotlin", "mobile app", "mobile development"],
    "iot_embedded": ["iot", "embedded", "raspberry pi", "arduino", "microcontroller", "sensors", "firmware", "mqtt", "internet of things"],
    "game_development": ["game dev", "game development", "unity", "unreal", "c# for games", "game design", "godot", "graphics", "3d game"],
    "interview_prep": ["interview", "leetcode", "dsa", "data structures", "algorithms", "system design", "coding interview", "technical screen", "competitive programming"],
    "software_engineering": ["software engineer", "software engineering", "swe", "clean code", "design patterns", "oop", "refactoring", "solid principles", "architecture", "generalist"],
}


def _load_catalog(catalog: list[dict[str, Any]] | None) -> list[dict[str, Any]]:
    if catalog is not None:
        return catalog
    with open(_CATALOG_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def _infer_domains(profile: dict[str, Any]) -> set[str]:
    """Infer relevant catalog domain(s) from goal text + interests + tags overlap."""
    text = " ".join(
        [
            str(profile.get("goal", "")),
            str(profile.get("goal_type", "")),
            " ".join(profile.get("interests", []) or []),
        ]
    ).lower()

    domains: set[str] = set()
    for domain, keywords in _DOMAIN_KEYWORDS.items():
        if any(kw in text for kw in keywords):
            domains.add(domain)

    # Fallback: match interests directly against catalog domain names.
    for interest in profile.get("interests", []) or []:
        norm = interest.strip().lower().replace(" ", "_")
        if norm in _DOMAIN_KEYWORDS:
            domains.add(norm)

    # If nothing matched, don't filter by domain — let level/tag scoring decide.
    return domains


def _target_level(experience_level: str) -> str:
    """A learner's starting resources should sit at-or-just-above their level."""
    return experience_level if experience_level in _LEVEL_ORDER else "beginner"


def _score_resource(resource: dict[str, Any], profile: dict[str, Any], domains: set[str]) -> float:
    score = 0.0

    # Domain match is the strongest signal.
    if domains:
        if resource["domain"] in domains:
            score += 5.0
        else:
            score -= 3.0  # heavily deprioritize off-domain resources, don't hard-exclude
    else:
        score += 1.0  # no strong domain signal — treat all domains as roughly equal

    # Level proximity: prefer resources at or one step above the learner's level.
    target = _LEVEL_ORDER[_target_level(profile.get("experience_level", "beginner"))]
    resource_level = _LEVEL_ORDER.get(resource["level"], 0)
    level_gap = resource_level - target
    if level_gap == 0:
        score += 3.0
    elif level_gap == 1:
        score += 1.5
    elif level_gap < 0:
        score += 0.5  # slightly below level is fine (review/foundation)
    else:
        score -= 2.0  # too advanced right now

    # Tag overlap with interests + current_skills (skills = "already knows",
    # so overlap here is a weaker positive than interest overlap).
    interests = {s.strip().lower() for s in (profile.get("interests") or [])}
    skills = {s.strip().lower() for s in (profile.get("current_skills") or [])}
    tags = {t.strip().lower() for t in (resource.get("tags") or [])}

    score += 1.5 * len(tags & interests)
    score += 0.5 * len(tags & skills)

    # Duration fit vs. weekly_time_hours: mildly prefer resources that fit
    # inside a single week's budget so the roadmap feels achievable.
    weekly_hours = profile.get("weekly_time_hours")
    if weekly_hours:
        if resource.get("duration_hours", 0) <= weekly_hours:
            score += 0.5

    # VARK learning style bonus
    learning_style = profile.get("learning_style")
    if isinstance(learning_style, dict):
        dominant_style = learning_style.get("dominant_style")
        if dominant_style == "visual" and resource.get("type") in ("video", "course"):
            score += 1.5
        elif dominant_style == "read_write" and resource.get("type") in ("article", "book"):
            score += 1.5
        elif dominant_style == "kinesthetic" and resource.get("type") in ("project", "assessment"):
            score += 1.5
        elif dominant_style == "auditory":
            res_tags = {t.strip().lower() for t in (resource.get("tags") or [])}
            auditory_tags = {"podcast", "lecture", "audio", "discussion", "talk"}
            if (res_tags & auditory_tags) or resource.get("type") == "video":
                score += 1.5
        elif dominant_style == "multimodal":
            ls_scores = learning_style.get("scores", {})
            rtype = resource.get("type")
            if rtype in ("video", "course") and ls_scores.get("visual", 0) > 0:
                score += 0.75
            elif rtype in ("article", "book") and ls_scores.get("read_write", 0) > 0:
                score += 0.75
            elif rtype in ("project", "assessment") and ls_scores.get("kinesthetic", 0) > 0:
                score += 0.75

    return score


def _prereqs_satisfied(resource: dict[str, Any], completed_ids: set[str]) -> bool:
    prereqs = resource.get("prerequisites") or []
    return all(p in completed_ids for p in prereqs)


def get_candidates(
    profile: dict[str, Any],
    catalog: list[dict[str, Any]] | None = None,
    top_k: int = 40,
    completed_ids: set[str] | None = None,
) -> list[dict[str, Any]]:
    """
    Return up to `top_k` catalog resources ranked for this learner profile.

    - Filters nothing out hard except catalog integrity issues; scoring
      deprioritizes bad fits instead, so the LLM still has enough breadth
      to build a coherent, prerequisite-respecting sequence.
    - Resources whose prerequisites are not yet satisfied are still
      returned (the LLM/roadmap sequencer needs to see them to place them
      correctly later in the path) but are tagged with "_prereqs_met".
    - Every returned item includes "_score" (debugging/testing only —
      strip before persisting/sending if you want a clean contract object).
    """
    items = _load_catalog(catalog)
    completed_ids = completed_ids or set()
    domains = _infer_domains(profile)

    scored: list[dict[str, Any]] = []
    for resource in items:
        r = dict(resource)
        r["_score"] = round(_score_resource(resource, profile, domains), 3)
        r["_prereqs_met"] = _prereqs_satisfied(resource, completed_ids)
        scored.append(r)

    scored.sort(key=lambda r: r["_score"], reverse=True)
    return scored[:top_k]


def get_candidate_ids(profile: dict[str, Any], **kwargs: Any) -> list[str]:
    """Convenience wrapper — just the resource ids, in ranked order."""
    return [r["id"] for r in get_candidates(profile, **kwargs)]


if __name__ == "__main__":
    # Quick manual smoke test: python recommender/ranking.py
    demo_profile = {
        "goal": "Become an AI engineer",
        "goal_type": "career_transition",
        "experience_level": "beginner",
        "current_skills": ["python"],
        "interests": ["machine learning", "llm"],
        "timeline_months": 6,
        "weekly_time_hours": 10,
        "constraints": [],
    }
    for res in get_candidates(demo_profile, top_k=8):
        print(f"{res['_score']:>5} | {res['domain']:15} | {res['level']:12} | {res['title']}")
