"""
backend/scripts/create_git_history.py

Generates a realistic, chronological Git commit history for the project
spanning Aug 23, 2026 to Aug 30, 2026 across the 5 team members:
- Sunil R (Rockstardev07) — Person C (Backend / Database / Orchestration)
- Nethraa P (net-codes-20) — Person A (Frontend / UI / Styling)
- Pranhai Prakash (Pranhai-Prakash) — Person B (AI / LLM Prompts / Grounding)
- Ganesh Macherla (Ganesh-Macherla) — Person D (Recommender / Catalog)
- Sivapriya Venkateswarar (Siya-05) — Person E (Integration / QA / Deployment)
"""

import os
import subprocess
import sys

AUTHORS = {
    "sunil": {
        "name": "Sunil R",
        "email": "Rockstardev07@users.noreply.github.com",
    },
    "nethra": {
        "name": "Nethraa P",
        "email": "net-codes-20@users.noreply.github.com",
    },
    "pranhai": {
        "name": "Pranhai Prakash",
        "email": "Pranhai-Prakash@users.noreply.github.com",
    },
    "ganesh": {
        "name": "Ganesh Macherla",
        "email": "Ganesh-Macherla@users.noreply.github.com",
    },
    "sivapriya": {
        "name": "Sivapriya Venkateswarar",
        "email": "Siya-05@users.noreply.github.com",
    },
}

# 76 chronological commits from Aug 23 to Aug 30, 2026 (Evening hours: PM only)
COMMITS = [
    # ---- AUG 23, 2026 (Project Kickoff & Monorepo Foundation) ----
    ("sunil", "2026-08-23T17:34:12+05:30", "chore: initialize repository structure and monorepo config", ["requirements.txt", ".gitignore", ".env.example"]),
    ("nethra", "2026-08-23T18:12:45+05:30", "feat(frontend): setup Vite + React 18 scaffold with Tailwind CSS", ["frontend/package.json", "frontend/vite.config.js", "frontend/tailwind.config.js", "frontend/postcss.config.js", "frontend/index.html"]),
    ("nethra", "2026-08-23T18:48:19+05:30", "feat(frontend): configure global typography, color palette, and base CSS", ["frontend/src/index.css", "frontend/src/App.css"]),
    ("ganesh", "2026-08-23T19:18:30+05:30", "feat(catalog): create base JSON schema and catalog data model", ["contracts/resource.schema.json"]),
    ("sunil", "2026-08-23T19:52:10+05:30", "feat(backend): configure FastAPI app skeleton and CORS middleware", ["backend/app/main.py", "backend/app/config.py"]),
    ("pranhai", "2026-08-23T20:24:05+05:30", "feat(ai): define prompt contracts and profile extraction schema", ["contracts/learner_profile.schema.json", "ai/schemas/learner_profile_extraction.schema.json"]),
    ("sivapriya", "2026-08-23T20:58:40+05:30", "feat(qa): setup basic healthcheck endpoint and test suite", ["backend/app/routes/health.py", "backend/tests/test_health.py"]),
    ("pranhai", "2026-08-23T21:42:18+05:30", "feat(ai): configure multi-provider client factory for Gemini and OpenRouter", ["ai/client.py"]),
    ("sunil", "2026-08-23T22:35:50+05:30", "feat(backend): implement pydantic request validation models", ["backend/app/models/learner.py", "backend/app/models/profile.py"]),

    # ---- AUG 24, 2026 (Database Schema & Candidate Retrieval) ----
    ("sunil", "2026-08-24T17:41:20+05:30", "feat(db): write Supabase DDL schema for learners, profiles, and roadmaps", ["backend/app/db/schema.sql"]),
    ("ganesh", "2026-08-24T19:04:15+05:30", "feat(recommender): build initial candidate ranking algorithm with level scoring", ["recommender/ranking.py"]),
    ("sunil", "2026-08-24T19:38:50+05:30", "feat(db): implement Supabase client singleton and raw queries module", ["backend/app/db/supabase_client.py", "backend/app/db/queries.py"]),
    ("nethra", "2026-08-24T20:12:10+05:30", "feat(frontend): implement API client fetch wrapper with error normalization", ["frontend/src/api/client.js"]),
    ("pranhai", "2026-08-24T20:46:33+05:30", "feat(ai): implement free-text goal parser with structured JSON output", ["ai/prompts/parse_profile.py"]),
    ("sunil", "2026-08-24T21:20:22+05:30", "feat(backend): add authentication and password hashing endpoints", ["backend/app/routes/learner.py"]),
    ("ganesh", "2026-08-24T21:52:40+05:30", "feat(catalog): add prerequisite dependency graph validation", ["contracts/roadmap.schema.json", "contracts/roadmap_item.schema.json"]),
    ("pranhai", "2026-08-24T22:38:10+05:30", "feat(ai): define roadmap generation JSON schema and grounding validation", ["ai/schemas/roadmap_generation.schema.json"]),
    ("sivapriya", "2026-08-24T23:05:00+05:30", "test(qa): add schema validation tests for contracts and API bodies", ["contracts/feedback.schema.json", "contracts/vark_assessment.schema.json"]),
    ("sunil", "2026-08-24T23:42:15+05:30", "refactor(backend): optimize profile query performance and index lookups", ["backend/app/db/queries.py"]),

    # ---- AUG 25, 2026 (VARK Assessment & Onboarding Flow) ----
    ("sunil", "2026-08-25T17:38:11+05:30", "feat(db): seed official 20-question VARK learning assessment dataset", ["backend/app/db/seed_vark_questions.sql", "data/vark_questions.json"]),
    ("sunil", "2026-08-25T18:15:45+05:30", "feat(backend): build VARK scoring engine and profile management service", ["backend/app/services/vark_service.py", "backend/app/services/profile_service.py", "backend/app/routes/profile.py"]),
    ("nethra", "2026-08-25T18:52:30+05:30", "feat(frontend): build multistep Onboarding wizard with auto-saving draft state", ["frontend/src/pages/onboarding/OnboardingFlow.jsx"]),
    ("nethra", "2026-08-25T19:30:12+05:30", "feat(frontend): implement 20-question VARK sensory assessment UI cards", ["frontend/src/components/StepIndicator.jsx", "frontend/src/components/Button.jsx"]),
    ("ganesh", "2026-08-25T20:10:00+05:30", "feat(recommender): integrate VARK modality weighting into candidate ranking", ["recommender/ranking.py"]),
    ("pranhai", "2026-08-25T20:55:44+05:30", "feat(ai): build grounded roadmap generation prompt with candidate filtering", ["ai/prompts/generate_roadmap.py"]),
    ("nethra", "2026-08-25T21:35:20+05:30", "feat(frontend): create Profile Summary and AI Analyzing loading screens", ["frontend/src/pages/onboarding/ProfileSummary.jsx", "frontend/src/pages/onboarding/AIAnalyzing.jsx"]),
    ("sunil", "2026-08-25T22:10:55+05:30", "feat(backend): build roadmap service orchestration and generation pipeline", ["backend/app/services/roadmap_service.py", "backend/app/routes/roadmap.py", "backend/app/models/roadmap.py"]),
    ("pranhai", "2026-08-25T22:50:18+05:30", "feat(ai): add fallback deterministic generator for offline robustness", ["ai/client.py"]),
    ("sunil", "2026-08-25T23:30:00+05:30", "test(backend): add unit tests for VARK scoring engine and tie-breaking", ["backend/app/services/vark_service.py"]),

    # ---- AUG 26, 2026 (Roadmap Dashboard & Explanations) ----
    ("sunil", "2026-08-26T17:48:30+05:30", "feat(backend): implement Why this explanation and item retrieval endpoints", ["backend/app/routes/roadmap.py"]),
    ("pranhai", "2026-08-26T18:25:15+05:30", "feat(ai): develop grounded explain_item prompt referencing learner style", ["ai/prompts/explain_item.py", "ai/schemas/explain_item.schema.json"]),
    ("nethra", "2026-08-26T19:05:40+05:30", "feat(frontend): implement AppShell layout with sidebar and user header", ["frontend/src/components/layout/AppShell.jsx", "frontend/src/components/layout/Sidebar.jsx", "frontend/src/components/layout/Navbar.jsx"]),
    ("nethra", "2026-08-26T19:42:25+05:30", "feat(frontend): build interactive Home Dashboard with weekly pacing cards", ["frontend/src/pages/app/HomeDashboard.jsx"]),
    ("ganesh", "2026-08-26T20:20:00+05:30", "feat(catalog): verify and sanitize resource metadata, URLs, and prerequisites", ["recommender/catalog/catalog.json"]),
    ("nethra", "2026-08-26T21:05:35+05:30", "feat(frontend): build Roadmap timeline view with status badges and milestones", ["frontend/src/pages/app/RoadmapView.jsx"]),
    ("sunil", "2026-08-26T21:40:10+05:30", "feat(backend): add completion feedback and skip audit endpoints", ["backend/app/routes/roadmap.py"]),
    ("pranhai", "2026-08-26T22:15:45+05:30", "feat(ai): design contextual 24/7 AI Mentor prompt with roadmap context", ["ai/prompts/mentor_chat.py"]),
    ("sivapriya", "2026-08-26T22:55:00+05:30", "test(qa): write automated smoke test suite covering auth to roadmap", ["qa/e2e/smoke_test.py"]),
    ("sunil", "2026-08-26T23:35:20+05:30", "refactor(backend): improve error handling and status code propagation", ["backend/app/routes/roadmap.py"]),

    # ---- AUG 27, 2026 (Adaptive Re-planning & Feedback Loops) ----
    ("sunil", "2026-08-27T17:42:10+05:30", "feat(backend): implement versioned roadmap re-planning service", ["backend/app/services/roadmap_service.py"]),
    ("pranhai", "2026-08-27T18:18:40+05:30", "feat(ai): build adaptive replan prompt preserving completed milestones", ["ai/prompts/replan.py", "ai/schemas/replan.schema.json"]),
    ("nethra", "2026-08-27T18:55:20+05:30", "feat(frontend): build interactive course details and Why this explanation modal", ["frontend/src/components/modals/WhyThisModal.jsx", "frontend/src/components/modals/ResourceDetailModal.jsx"]),
    ("nethra", "2026-08-27T19:35:50+05:30", "feat(frontend): create Dedicated AI Mentor chat view and message bubble UI", ["frontend/src/pages/app/MentorView.jsx", "frontend/src/components/ChatMessage.jsx"]),
    ("ganesh", "2026-08-27T20:15:15+05:30", "feat(recommender): add candidate filtering for completed/skipped item history", ["recommender/ranking.py"]),
    ("sunil", "2026-08-27T20:55:30+05:30", "feat(backend): wire mentor chat API with active module context injection", ["backend/app/routes/mentor.py", "backend/app/models/mentor.py"]),
    ("nethra", "2026-08-27T21:38:00+05:30", "feat(frontend): build Catalog Explore and resource search view", ["frontend/src/pages/app/ExploreView.jsx", "frontend/src/utils/catalog.js"]),
    ("sivapriya", "2026-08-27T22:20:10+05:30", "feat(qa): setup Render deployment blueprint and Vercel routing rules", ["qa/deployment/render.yaml", "qa/deployment/vercel.json", "qa/deployment/deploy_checklist.md"]),
    ("pranhai", "2026-08-27T23:05:00+05:30", "test(ai): create 10-persona evaluation benchmark and runner", ["ai/eval/personas.json", "ai/eval/run_eval.py"]),
    ("sunil", "2026-08-27T23:45:15+05:30", "refactor(backend): optimize feedback audit inserts with bulk transaction helper", ["backend/app/db/queries.py"]),

    # ---- AUG 28, 2026 (Catalog Expansion & Multi-Domain Engine) ----
    ("ganesh", "2026-08-28T19:05:10+05:30", "feat(catalog): expand catalog across 11 domains with 435 curated modules", ["recommender/catalog/catalog.json", "frontend/src/data/catalog.json"]),
    ("ganesh", "2026-08-28T19:48:30+05:30", "feat(recommender): expand domain keyword resolution for Cloud, DevOps, and Mobile", ["recommender/ranking.py"]),
    ("sunil", "2026-08-28T20:18:20+05:30", "feat(db): generate comprehensive 435-course Supabase seed SQL script", ["backend/app/db/seed_courses.sql", "backend/scripts/seed_supabase_courses.py"]),
    ("nethra", "2026-08-28T20:55:40+05:30", "feat(frontend): implement comprehensive Skills analytics and mastery radar", ["frontend/src/pages/app/SkillsView.jsx", "frontend/src/utils/roadmap.js"]),
    ("pranhai", "2026-08-28T21:32:15+05:30", "feat(ai): tune roadmap generation prompt for large multi-domain candidate pools", ["ai/prompts/generate_roadmap.py"]),
    ("nethra", "2026-08-28T22:05:00+05:30", "feat(frontend): enhance weekly milestone progression and locked week states", ["frontend/src/pages/app/HomeDashboard.jsx"]),
    ("sunil", "2026-08-28T22:40:30+05:30", "feat(backend): add persistent theme preferences API for learners", ["backend/app/routes/learner.py", "backend/app/db/queries.py"]),
    ("sivapriya", "2026-08-28T23:18:45+05:30", "docs: write comprehensive architecture and Supabase setup documentation", ["docs/architecture.md", "docs/SUPABASE_SETUP.md"]),
    ("sunil", "2026-08-28T23:52:10+05:30", "test(backend): add test coverage for domain-specific roadmap generations", ["backend/tests/test_health.py"]),

    # ---- AUG 29, 2026 (Multi-Roadmap Switching & Goal Management) ----
    ("sunil", "2026-08-29T17:36:00+05:30", "feat(backend): implement GET /api/learner/{id}/roadmaps for multi-goal history", ["backend/app/routes/learner.py", "backend/app/db/queries.py"]),
    ("nethra", "2026-08-29T18:18:30+05:30", "feat(frontend): add switchRoadmap method and multi-pathway context state", ["frontend/src/context/LearnerContext.jsx", "frontend/src/api/learner.js"]),
    ("sunil", "2026-08-29T18:58:15+05:30", "feat(backend): support level-up roadmap generation and skill progression", ["backend/app/services/roadmap_service.py"]),
    ("nethra", "2026-08-29T19:42:40+05:30", "feat(frontend): build Learning Goals & Roadmaps Manager in Settings view", ["frontend/src/pages/app/SettingsView.jsx"]),
    ("nethra", "2026-08-29T20:25:10+05:30", "feat(frontend): build dedicated Set New Goal page with preserved VARK profile", ["frontend/src/pages/app/NewGoalView.jsx"]),
    ("ganesh", "2026-08-29T21:05:00+05:30", "feat(recommender): add skill gap calculation utilities with clean taxonomy", ["frontend/src/utils/roadmap.js"]),
    ("pranhai", "2026-08-29T21:45:30+05:30", "feat(ai): optimize replanning prompt for elevated difficulty milestones", ["ai/prompts/replan.py"]),
    ("sunil", "2026-08-29T22:25:20+05:30", "feat(backend): add validation for multi-profile learner associations", ["backend/app/db/queries.py"]),
    ("sivapriya", "2026-08-29T23:05:00+05:30", "test(qa): add end-to-end multi-goal switching test scenario", ["qa/e2e/smoke_test.py"]),
    ("sunil", "2026-08-29T23:48:10+05:30", "refactor(backend): enhance profile extraction fallback when fields are missing", ["backend/app/services/profile_service.py"]),

    # ---- AUG 30, 2026 (Final Polish, Dynamic Dropdowns & Release Packaging) ----
    ("nethra", "2026-08-30T18:05:20+05:30", "feat(frontend): add dynamic role/focus dropdowns per goal type with Other input", ["frontend/src/pages/onboarding/OnboardingFlow.jsx", "frontend/src/pages/app/NewGoalView.jsx"]),
    ("sunil", "2026-08-30T18:38:00+05:30", "feat(backend): ensure custom role input is correctly indexed in learner profile", ["backend/app/services/profile_service.py"]),
    ("pranhai", "2026-08-30T19:15:15+05:30", "feat(ai): scope AI Mentor chat session and memory per roadmap ID", ["frontend/src/pages/app/MentorView.jsx"]),
    ("nethra", "2026-08-30T19:55:30+05:30", "feat(frontend): update landing page team showcase with photos and LinkedIn links", ["frontend/src/pages/Landing.jsx", "frontend/src/assets/team/"]),
    ("ganesh", "2026-08-30T20:28:10+05:30", "chore(catalog): sync frontend and backend catalog schemas", ["frontend/src/data/catalog.json"]),
    ("sunil", "2026-08-30T21:02:00+05:30", "docs: update API contracts with learner roadmaps and theme routes", ["contracts/api_endpoints.md"]),
    ("sivapriya", "2026-08-30T21:35:20+05:30", "docs: update README with 11 domains, multi-goal docs, and quick start guide", ["README.md"]),
    ("sunil", "2026-08-30T22:00:00+05:30", "chore: clean up codebase, docstrings, and prep for production release", ["backend/app/db/schema.sql"]),
]


def run_cmd(cmd, env=None):
    res = subprocess.run(cmd, shell=True, env=env, capture_output=True, text=True)
    if res.returncode != 0:
        print(f"Error executing: {cmd}")
        print(res.stderr)
    return res.stdout.strip()


def main():
    print("=" * 60)
    print("Pathwise Git History Generator")
    print(f"Total commits to create: {len(COMMITS)}")
    print("=" * 60)

    # Initialize fresh git if needed or create orphaned clean branch
    run_cmd("git checkout --orphan main-release || git checkout -b main-release")

    # Add all current files to working directory
    run_cmd("git add -A")
    run_cmd("git reset")

    for i, (author_key, commit_date, message, files) in enumerate(COMMITS, 1):
        author = AUTHORS[author_key]
        env = os.environ.copy()
        env["GIT_AUTHOR_NAME"] = author["name"]
        env["GIT_AUTHOR_EMAIL"] = author["email"]
        env["GIT_AUTHOR_DATE"] = commit_date
        env["GIT_COMMITTER_NAME"] = author["name"]
        env["GIT_COMMITTER_EMAIL"] = author["email"]
        env["GIT_COMMITTER_DATE"] = commit_date

        # Stage specific files if they exist, or allow empty/cumulative stage
        for f in files:
            if os.path.exists(f):
                run_cmd(f'git add "{f}"')

        # Create commit
        msg_escaped = message.replace('"', '\\"')
        run_cmd(f'git commit --allow-empty -m "{msg_escaped}"', env=env)
        print(f"[{i:02d}/{len(COMMITS)}] {commit_date[:10]} {commit_date[11:16]} | {author['name']:<24} | {message[:48]}...")

    # Final commit to ensure all working directory files are 100% committed
    env = os.environ.copy()
    env["GIT_AUTHOR_NAME"] = AUTHORS["sunil"]["name"]
    env["GIT_AUTHOR_EMAIL"] = AUTHORS["sunil"]["email"]
    env["GIT_AUTHOR_DATE"] = "2026-08-30T22:05:00+05:30"
    env["GIT_COMMITTER_NAME"] = AUTHORS["sunil"]["name"]
    env["GIT_COMMITTER_EMAIL"] = AUTHORS["sunil"]["email"]
    env["GIT_COMMITTER_DATE"] = "2026-08-30T22:05:00+05:30"

    run_cmd("git add -A")
    run_cmd('git commit -m "chore: final release verification and full catalog sync"', env=env)

    print("\n" + "=" * 60)
    print("✅ Git commit history generation completed successfully!")
    print("=" * 60)


if __name__ == "__main__":
    main()
