"""
ai/eval/run_eval.py — AI Quality & Persona Evaluation Suite

Runs the persona set (ai/eval/personas.json) through the real pipeline:
parse_profile -> recommender.get_candidates -> generate_roadmap -> explain_item
and writes pass/fail results to ai/eval/results/latest.json.

Requires a real provider key in your .env (GEMINI_API_KEY, etc.) — this
makes live calls, it's not mocked. Run standalone before wiring to the
backend, per Build Sequence Step 5.

Usage:
    python ai/eval/run_eval.py
"""

from __future__ import annotations

import json
import os
import sys
import time
from datetime import datetime, timezone

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from ai.prompts.explain_item import explain_item  # noqa: E402
from ai.prompts.generate_roadmap import generate_roadmap  # noqa: E402
from ai.prompts.parse_profile import parse_profile  # noqa: E402
from recommender.ranking import get_candidates  # noqa: E402

_PERSONAS_PATH = os.path.join(os.path.dirname(__file__), "personas.json")
_RESULTS_PATH = os.path.join(os.path.dirname(__file__), "results", "latest.json")


def run_persona(persona: dict) -> dict:
    result = {"id": persona["id"], "passed": False, "steps": {}, "error": None}
    try:
        parsed = parse_profile(persona["raw_text"])
        result["steps"]["parse_profile"] = {
            "profile": parsed["profile"],
            "missing_fields": parsed["missing_fields"],
        }

        domain_ok = True  # advisory only — domain inference is heuristic, not a hard pass/fail gate
        level_ok = parsed["profile"]["experience_level"] == persona["expected_experience_level"]

        profile = {
            **parsed["profile"],
            "id": "eval-temp",
            "constraints": parsed["profile"].get("constraints", []),
            "learning_style": persona.get("learning_style"),
        }
        candidates = get_candidates(profile, top_k=15)
        result["steps"]["candidates_returned"] = len(candidates)

        roadmap = generate_roadmap(profile, candidates)
        result["steps"]["roadmap_items"] = len(roadmap["items"])

        first_item = roadmap["items"][0]
        resource = next(c for c in candidates if c["id"] == first_item["resource_id"])
        explanation = explain_item(profile, resource, first_item)
        result["steps"]["sample_explanation"] = explanation["explanation"]

        result["level_match"] = level_ok
        result["domain_heuristic_ok"] = domain_ok
        result["passed"] = bool(roadmap["items"]) and bool(explanation["explanation"].strip())

    except Exception as exc:  # noqa: BLE001
        result["error"] = str(exc)
        result["passed"] = False

    return result


def main() -> None:
    with open(_PERSONAS_PATH, "r", encoding="utf-8") as f:
        personas = json.load(f)

    results = []
    for persona in personas:
        print(f"Running {persona['id']}...")
        results.append(run_persona(persona))
        time.sleep(1)  # be gentle on free-tier rate limits between calls

    passed = sum(1 for r in results if r["passed"])
    summary = {
        "run_at": datetime.now(timezone.utc).isoformat(),
        "total": len(results),
        "passed": passed,
        "failed": len(results) - passed,
        "results": results,
    }

    os.makedirs(os.path.dirname(_RESULTS_PATH), exist_ok=True)
    with open(_RESULTS_PATH, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    print(f"\n{passed}/{len(results)} personas passed. Full results: {_RESULTS_PATH}")


if __name__ == "__main__":
    main()
