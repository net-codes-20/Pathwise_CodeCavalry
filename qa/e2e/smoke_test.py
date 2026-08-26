"""
qa/e2e/smoke_test.py — End-to-End API Smoke Test Suite

Runs the full chain against a running backend (local or deployed):
  learner/start -> profile/parse -> profile -> roadmap/generate ->
  roadmap/{id} -> explain -> feedback -> replan -> health

Exits non-zero on any failure so it can be used as a pre-submission /
pre-deploy gate (Section 7 checklist: "Full flow works end-to-end").

Usage:
    python qa/e2e/smoke_test.py --base-url http://localhost:8000/api
    python qa/e2e/smoke_test.py --base-url https://your-app.onrender.com/api
"""

from __future__ import annotations

import argparse
import sys

import requests

PASS = "✅"
FAIL = "❌"


def step(name: str, ok: bool, detail: str = "") -> bool:
    print(f"{PASS if ok else FAIL} {name}{(' — ' + detail) if detail and not ok else ''}")
    return ok


def run(base_url: str) -> bool:
    all_ok = True

    r = requests.get(f"{base_url}/health", timeout=10)
    all_ok &= step("GET /health", r.status_code == 200 and r.json().get("status") == "ok", r.text)

    r = requests.post(f"{base_url}/learner/start", json={"name": "QA Smoke Test"}, timeout=10)
    ok = r.status_code == 200 and "learner_id" in r.json()
    all_ok &= step("POST /learner/start", ok, r.text)
    if not ok:
        return all_ok
    learner_id = r.json()["learner_id"]

    r = requests.post(
        f"{base_url}/profile/parse",
        json={
            "learner_id": learner_id,
            "raw_text": "I want to become an AI engineer in 6 months. I know some Python.",
        },
        timeout=30,
    )
    ok = r.status_code == 200 and "profile" in r.json()
    all_ok &= step("POST /profile/parse", ok, r.text)
    if not ok:
        return all_ok
    profile_fields = r.json()["profile"]

    # POST /profile/vark
    vark_payload = {
        "learner_id": learner_id,
        "answers": [
            {"question_id": "q1", "selected_option": "visual"},
            {"question_id": "q2", "selected_option": "visual"},
            {"question_id": "q3", "selected_option": "kinesthetic"},
            {"question_id": "q4", "selected_option": "read_write"},
            {"question_id": "q5", "selected_option": "auditory"},
        ]
    }
    r = requests.post(f"{base_url}/profile/vark", json=vark_payload, timeout=10)
    ok = r.status_code == 200 and "learning_style" in r.json()
    all_ok &= step("POST /profile/vark", ok, r.text)
    if not ok:
        return all_ok
    learning_style = r.json()["learning_style"]

    # POST /profile (saving learning style)
    r = requests.post(f"{base_url}/profile", json={"learner_id": learner_id, "learning_style": learning_style, **profile_fields}, timeout=10)
    ok = r.status_code == 201 and "profile_id" in r.json()
    all_ok &= step("POST /profile", ok, r.text)
    if not ok:
        return all_ok
    profile_id = r.json()["profile_id"]

    r = requests.get(f"{base_url}/profile/{profile_id}", timeout=10)
    all_ok &= step("GET /profile/{id}", r.status_code == 200, r.text)

    r = requests.post(f"{base_url}/roadmap/generate", json={"profile_id": profile_id}, timeout=60)
    ok = r.status_code == 201 and "roadmap" in r.json()
    all_ok &= step("POST /roadmap/generate", ok, r.text)
    if not ok:
        return all_ok
    roadmap = r.json()["roadmap"]
    roadmap_id = roadmap["id"]

    ok = len(roadmap.get("items", [])) > 0
    all_ok &= step("Roadmap has items", ok)
    if not ok:
        return all_ok
    first_item = roadmap["items"][0]

    r = requests.get(f"{base_url}/roadmap/{roadmap_id}", timeout=10)
    all_ok &= step("GET /roadmap/{id}", r.status_code == 200, r.text)

    r = requests.post(
        f"{base_url}/roadmap/{roadmap_id}/explain",
        json={"roadmap_item_id": first_item["id"]},
        timeout=30,
    )
    all_ok &= step("POST /roadmap/{id}/explain", r.status_code == 200 and "explanation" in r.json(), r.text)

    r = requests.post(
        f"{base_url}/roadmap/{roadmap_id}/feedback",
        json={"roadmap_item_id": first_item["id"], "action": "complete"},
        timeout=15,
    )
    all_ok &= step("POST /roadmap/{id}/feedback", r.status_code == 200, r.text)

    r = requests.post(f"{base_url}/roadmap/{roadmap_id}/replan", json={"roadmap_id": roadmap_id}, timeout=60)
    all_ok &= step("POST /roadmap/{id}/replan", r.status_code == 200 and "changes_summary" in r.json(), r.text)

    return all_ok


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default="http://localhost:8000/api")
    args = parser.parse_args()

    print(f"Running smoke test against {args.base_url}\n")
    success = run(args.base_url)
    print(f"\n{'All checks passed.' if success else 'Some checks FAILED — see above.'}")
    sys.exit(0 if success else 1)
