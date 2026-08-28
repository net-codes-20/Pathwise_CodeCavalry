# System Architecture & Technical Specification

> Reference for Section 5 ("System architecture") of the Solution Documentation for the **AI-Powered Personalized Learning Path Recommender (Pathwise)**.

---

## 1. End-to-End Pipeline

```
                     ┌─────────────────────────────────────────────────────────┐
                     │                   USER / FRONTEND (React)               │
                     └─────────────────────────────────────────────────────────┘
                                                  │
                      1. Auth / Register / Login  ▼
                     ┌─────────────────────────────────────────────────────────┐
                     │ POST /api/auth/register or POST /api/auth/login         │
                     │  → Persists learner credentials in Supabase             │
                     └─────────────────────────────────────────────────────────┘
                                                  │
                      2. Free-text Goal Input     ▼
                     ┌─────────────────────────────────────────────────────────┐
                     │ POST /api/profile/parse                                 │
                     │  → ai.parse_profile() extracts structured goal profile  │
                     └─────────────────────────────────────────────────────────┘
                                                  │
                      3. VARK Assessment MCQ      ▼
                     ┌─────────────────────────────────────────────────────────┐
                     │ POST /api/profile/vark                                  │
                     │  → vark_service scores Visual/Auditory/Read/Kinesthetic │
                     └─────────────────────────────────────────────────────────┘
                                                  │
                      4. Profile Review & Save    ▼
                     ┌─────────────────────────────────────────────────────────┐
                     │ POST /api/profile                                       │
                     │  → Saves learner profile to Supabase (returns profile_id)│
                     └─────────────────────────────────────────────────────────┘
                                                  │
                      5. Roadmap Generation       ▼
                     ┌─────────────────────────────────────────────────────────┐
                     │ POST /api/roadmap/generate                              │
                     │  1. recommender.get_candidates(profile, catalog)        │
                     │     (Deterministic score & prerequisite matching)       │
                     │  2. ai.generate_roadmap(profile, candidates)            │
                     │     (LLM sequences modules, marks milestones & reasons) │
                     │  3. Persists roadmap + roadmap_items into Supabase      │
                     └─────────────────────────────────────────────────────────┘
                                                  │
                      6. Interactive Learning & Feedback Loop
                                                  ▼
   ┌──────────────────────────────────────────────────────────────────────────────────┐
   │ • GET /api/roadmap/{id}        → Fetch personalized roadmap phases & items       │
   │ • POST /api/roadmap/{id}/explain → Grounded 2-4 sentence "Why this?" reason     │
   │ • POST /api/roadmap/{id}/feedback→ Complete/Skip item + feedback log            │
   │ • POST /api/roadmap/{id}/replan  → Regenerate remaining path (new roadmap ver)   │
   │ • POST /api/mentor/chat        → 24/7 Contextual AI Mentor chat guidance         │
   └──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. "Why this?" & Dynamic Re-planning Loop

```
Frontend → POST /api/roadmap/{id}/explain 
           → ai.explain_item(profile, resource, roadmap_item)
           → Returns personalized, grounded explanation referencing learner style & resource details
           → Grounded fallback guarantees 100% uptime if external AI provider quota is exceeded.

Frontend → POST /api/roadmap/{id}/feedback (action: "complete" | "skip", note: optional)
           → Updates item status in Supabase roadmap_items table
           → Inserts row into feedback audit table
           → Triggers replan recommendation when items are skipped or every 3 completions.

Frontend → POST /api/roadmap/{id}/replan 
           → recommender.get_candidates(profile, completed_ids)
           → ai.replan(profile, history, fresh_candidates)
           → Creates new roadmap row (version + 1) in Supabase
           → Carries forward completed/skipped items (audit trail) and appends optimized sequence.
```

---

## 3. Grounding & Resilience Guardrails (Core AI Architecture)

The LLM is **strictly prevented from hallucinating or inventing resources**:
1. **Catalog Retrieval First**: Only candidate items retrieved and filtered by `recommender.get_candidates()` from `recommender/catalog/catalog.json` are supplied to the prompt.
2. **Schema & Candidate ID Validation**: `ai/prompts/generate_roadmap.py::_validate()` and `ai/prompts/replan.py::_validate()` enforce that every `resource_id` exists in the candidate set. Any invalid ID triggers an immediate validation error.
3. **Multi-Provider Fallback Hierarchy**:
   - Primary: Google Gemini (`gemini-2.0-flash`)
   - Secondary: OpenRouter (`openrouter/auto`)
   - Tertiary: NVIDIA NIM (`meta/llama-3.3-70b-instruct`)
4. **Deterministic Fallback Engine**: If all third-party AI APIs are unreachable or out of quota, the service executes deterministic grounded generators ensuring **zero 500 errors and 100% uptime**.

---

## 4. Repository Monorepo Structure

```
course_suggestion_CodeCavalry/
├── frontend/             # React 18 + Vite + Tailwind CSS (Responsive App Shell, Dark Mode)
│   ├── src/
│   │   ├── api/          # Axios/fetch client wrappers matching contract endpoints
│   │   ├── components/   # AppShell, Sidebar, Header, Modals, Toast, Button
│   │   ├── context/      # LearnerContext (Session, draft persistence, theme state)
│   │   ├── pages/        # Landing, Auth, Onboarding Flow, Home, Roadmap, Explore, etc.
│   │   └── utils/        # Roadmap phase grouping, catalog search, VARK helpers
│   └── package.json
├── backend/              # FastAPI + Pydantic + Supabase Database Layer
│   ├── app/
│   │   ├── db/           # queries.py (Supabase DB client) & schema.sql
│   │   ├── models/       # Pydantic schemas for auth, profile, roadmap, feedback
│   │   ├── routes/       # auth.py, profile.py, roadmap.py, mentor.py, health.py
│   │   ├── services/     # roadmap_service, profile_service, vark_service
│   │   └── config.py     # Centralized root .env configuration
│   └── tests/            # Pytest test suite for health, auth, and API routes
├── ai/                   # Provider-Agnostic LLM Engine
│   ├── client.py         # Multi-provider client with retry & fallback
│   ├── prompts/          # parse_profile, generate_roadmap, explain_item, replan, mentor_chat
│   ├── schemas/          # JSON schemas for structured LLM validation
│   └── eval/             # 10-persona evaluation suite
├── recommender/          # Deterministic Resource Recommender
│   ├── catalog/          # catalog.json (Curated multi-domain learning catalog)
│   ├── ranking.py        # Rule-based candidate scoring & prerequisite filtering
│   └── tests/            # Unit tests for candidate ranking
├── contracts/            # Frozen API endpoints markdown & JSON schemas
├── docs/                 # Solution documentation, Supabase setup, architecture
├── requirements.txt      # Shared Python dependencies
├── .env.example          # Single centralized environment variable template
└── README.md             # Project overview, setup, and run instructions
```

---

## 5. Supabase Relational Data Model

All database tables are provisioned via `backend/app/db/schema.sql`:

- **`learners`**:
  - `id (UUID, PK)`, `name (TEXT)`, `username (TEXT, UNIQUE)`, `password_hash (TEXT)`, `created_at (TIMESTAMPTZ)`
- **`learner_profiles`**:
  - `id (UUID, PK)`, `learner_id (UUID, FK -> learners.id)`, `goal (TEXT)`, `goal_type (TEXT)`, `experience_level (TEXT)`, `current_skills (JSONB)`, `interests (JSONB)`, `timeline_months (NUMERIC)`, `weekly_time_hours (NUMERIC)`, `constraints (JSONB)`, `dominant_style (TEXT)`, `vark_scores (JSONB)`, `created_at (TIMESTAMPTZ)`, `updated_at (TIMESTAMPTZ)`
- **`roadmaps`**:
  - `id (UUID, PK)`, `learner_profile_id (UUID, FK -> learner_profiles.id)`, `version (INTEGER)`, `generated_at (TIMESTAMPTZ)`
- **`roadmap_items`**:
  - `id (UUID, PK)`, `roadmap_id (UUID, FK -> roadmaps.id)`, `resource_id (TEXT)`, `order (INTEGER)`, `status (TEXT: upcoming | current | completed | skipped)`, `milestone (BOOLEAN)`, `reason (TEXT)`
- **`feedback`**:
  - `id (UUID, PK)`, `roadmap_item_id (UUID, FK -> roadmap_items.id)`, `action (TEXT: complete | skip)`, `note (TEXT)`, `timestamp (TIMESTAMPTZ)`

> **Catalog Note**: `resources` are stored in `recommender/catalog/catalog.json` as a versioned, static knowledge base. This keeps indexing deterministic, avoids database cold starts, and enables instant local testing.
