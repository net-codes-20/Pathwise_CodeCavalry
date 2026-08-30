"""
recommender/tests/test_ranking.py

Run with: pytest recommender/tests/test_ranking.py -v
"""

import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from recommender.ranking import get_candidates  # noqa: E402


def make_profile(**overrides):
    base = {
        "goal": "Become a data scientist",
        "goal_type": "career_transition",
        "experience_level": "beginner",
        "current_skills": [],
        "interests": ["data science"],
        "timeline_months": 6,
        "weekly_time_hours": 8,
        "constraints": [],
    }
    base.update(overrides)
    return base


def test_returns_nonempty_candidate_set():
    candidates = get_candidates(make_profile())
    assert len(candidates) > 0


def test_domain_inference_prioritizes_matching_domain():
    profile = make_profile(goal="I want to become an AI engineer", interests=["machine learning"])
    candidates = get_candidates(profile, top_k=5)
    top_domains = {c["domain"] for c in candidates}
    assert "ai_ml" in top_domains
    assert candidates[0]["domain"] == "ai_ml"


def test_beginner_gets_beginner_or_intermediate_top_results():
    profile = make_profile(experience_level="beginner")
    candidates = get_candidates(profile, top_k=10)
    assert all(c["level"] in ("beginner", "intermediate") for c in candidates[:5])


def test_advanced_learner_ranks_advanced_content_higher_than_pure_beginner():
    beginner_profile = make_profile(experience_level="beginner", interests=["web development"])
    advanced_profile = make_profile(experience_level="advanced", interests=["web development"])

    beginner_top = get_candidates(beginner_profile, top_k=5)[0]
    advanced_top = get_candidates(advanced_profile, top_k=5)[0]

    level_order = {"beginner": 0, "intermediate": 1, "advanced": 2}
    assert level_order[advanced_top["level"]] >= level_order[beginner_top["level"]]


def test_prereqs_met_flag_reflects_completed_ids():
    profile = make_profile(interests=["data science"])
    candidates = get_candidates(profile, completed_ids=set())
    no_history = {c["id"]: c["_prereqs_met"] for c in candidates}

    candidates_with_history = get_candidates(profile, completed_ids={"ds-001", "ds-002"})
    with_history = {c["id"]: c["_prereqs_met"] for c in candidates_with_history}

    # ds-003 requires ds-002, so it should flip from unmet -> met when ds-002 is completed.
    assert no_history.get("ds-003") is False
    assert with_history.get("ds-003") is True


def test_two_different_personas_get_visibly_different_top_candidates():
    """Mirrors the demo-video requirement: different learners -> different results."""
    alex = make_profile(
        goal="Become an AI engineer in 6 months",
        experience_level="intermediate",
        current_skills=["python", "web development"],
        interests=["machine learning"],
    )
    priya = make_profile(
        goal="Become an AI engineer in 6 months",
        experience_level="beginner",
        current_skills=[],
        interests=["machine learning"],
    )

    alex_top_ids = [c["id"] for c in get_candidates(alex, top_k=5)]
    priya_top_ids = [c["id"] for c in get_candidates(priya, top_k=5)]

    assert alex_top_ids != priya_top_ids


def test_learning_style_ranks_compatible_resource_types_higher():
    profile_read = make_profile(
        interests=["web development"],
        learning_style={"dominant_style": "read_write", "scores": {"visual": 0, "auditory": 0, "read_write": 10, "kinesthetic": 0}}
    )
    profile_kin = make_profile(
        interests=["web development"],
        learning_style={"dominant_style": "kinesthetic", "scores": {"visual": 0, "auditory": 0, "read_write": 0, "kinesthetic": 10}}
    )

    candidates_read = get_candidates(profile_read, top_k=20)
    candidates_kin = get_candidates(profile_kin, top_k=20)

    kin_scores = {c["id"]: c["_score"] for c in candidates_kin}
    read_scores = {c["id"]: c["_score"] for c in candidates_read}

    # Find a project in kinesthetic candidates
    project_resources = [c for c in candidates_kin if c["type"] in ("project", "assessment")]
    if project_resources:
        p_id = project_resources[0]["id"]
        assert kin_scores[p_id] > read_scores[p_id]
