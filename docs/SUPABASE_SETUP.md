# Supabase Setup & Project Run Guide

---

## 1. Create the Supabase Project

1. Go to [supabase.com](https://supabase.com) → Sign in → **New Project**.
2. Set your Organization, Project Name (e.g. `learning-path-recommender`), and Database Password.
3. Select your closest AWS/GCP region and click **Create new project** (takes ~2 minutes to provision).

---

## 2. Run the Database Schema & Seed Data

1. In the Supabase dashboard, navigate to **SQL Editor** (left navigation bar) → **New query**.
2. Open the schema file:
   ```
   backend/app/db/schema.sql
   ```
3. Copy the entire contents of `backend/app/db/schema.sql`, paste it into the Supabase SQL Editor, and click **Run**.
4. Now seed the **central course catalog** table and **VARK questionnaire**:
   - Open `backend/app/db/seed_courses.sql` → Paste and click **Run** (seeds 435 curated modules across all 11 technical domains).
   - Open `backend/app/db/seed_vark_questions.sql` → Paste and click **Run** (seeds the official 20 VARK assessment questions).
5. Verify your database tables: Go to **Table Editor** (left navigation bar) and confirm the following 7 tables exist:
   - `courses` (central course & resource catalog)
   - `vark_questions` (official 20-question VARK learning style questionnaire)
   - `learners` (includes `username`, `password_hash`, and persistent `theme`)
   - `learner_profiles` (includes `dominant_style`, `vark_scores`, and 20-char compact `vark_raw_string`)
   - `roadmaps`
   - `roadmap_items` (references `courses.id`)
   - `feedback`

> **Note on Migrations**: `backend/app/db/schema.sql` uses `IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS`, so running it multiple times is 100% safe and will not drop existing data.

---

## 3. Retrieve Your API Credentials

1. Go to **Project Settings** (gear icon in the bottom-left sidebar) → **API**.
2. Copy your **Project URL** (e.g. `https://xyzcompany.supabase.co`) → this is `SUPABASE_URL`.
3. Copy your **`service_role` secret key** (revealed under Project API Keys) → this is `SUPABASE_KEY`.

> **Important**: Use the `service_role` key, not the `anon` key. Row Level Security is bypassed by the backend server for this prototype, and the key is never exposed to the frontend or git.

---

## 4. Configure Environment Variables (`.env`)

Create your `.env` file at the **root of the repository**:

```bash
cp .env.example .env
```

Edit `.env` and fill in your values:

```env
# Supabase Database Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-service-role-secret-key

# AI Provider API Keys (At least one key is recommended; fallback engine handles offline mode)
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.0-flash

# Optional Alternative Providers
OPENROUTER_API_KEY=
OPENROUTER_MODEL=openrouter/auto

NVIDIA_NIM_API_KEY=
NVIDIA_NIM_MODEL=meta/llama-3.3-70b-instruct

# Frontend & CORS Configuration
CORS_ORIGINS=http://localhost:5173
VITE_API_BASE_URL=http://localhost:8000/api
```

> **Security Note**: Never commit `.env` to git. It is ignored by `.gitignore`.

---

## 5. Install Dependencies & Start the Servers

### Python Environment (Backend + AI + Recommender)
```bash
# Create and activate virtual environment
python -m venv venv

# Windows (PowerShell)
.\venv\Scripts\Activate.ps1
# macOS / Linux
source venv/bin/activate

# Install shared Python dependencies
pip install -r requirements.txt

# Start the FastAPI backend
cd backend
uvicorn app.main:app --reload --port 8000
```
- API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health Check: [http://localhost:8000/api/health](http://localhost:8000/api/health)

---

### Node Environment (Frontend)
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
- Frontend Application: [http://localhost:5173](http://localhost:5173)

---

## 6. Verify with End-to-End Smoke Test

Run the automated test to verify the complete pipeline (Auth → Parse → VARK → Profile → Roadmap → Explain → Feedback → Replan):

```bash
# From the repository root with virtual environment activated:
python qa/e2e/smoke_test.py --base-url http://localhost:8000/api
```

---

## 7. Troubleshooting

| Symptom | Cause & Solution |
|---|---|
| `SUPABASE_URL and SUPABASE_KEY must be set` | Ensure `.env` is located in the root repository directory (not inside `backend/`). |
| `relation "learner_profiles" does not exist` | Run the SQL script from `backend/app/db/schema.sql` in the Supabase SQL Editor. |
| `All configured AI providers failed` | Check `GEMINI_API_KEY` in `.env`. (The app will automatically fall back to deterministic generators). |
| `Frontend cannot connect to backend` | Ensure the backend is running on `http://localhost:8000` and `VITE_API_BASE_URL=http://localhost:8000/api` is in `.env`. |
| `catalog.json not found` | Ensure `recommender/catalog/catalog.json` exists and is readable. |
