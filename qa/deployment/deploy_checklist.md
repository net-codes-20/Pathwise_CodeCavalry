# Deployment Checklist — Person E

## Backend (Render)
1. Push to `main` with `backend/` at the repo root path referenced in `render.yaml`.
2. In Render dashboard: New → Blueprint → point at the repo → confirm `qa/deployment/render.yaml` is detected (or create the service manually with the same settings if not using Blueprints).
3. Set every `sync: false` env var in the Render dashboard (Environment tab) using the values from your root `.env` — **never commit these**.
4. Confirm the health check path `/api/health` returns `{"status": "ok"}` after first deploy.
5. Copy the deployed backend URL (e.g. `https://learning-path-recommender-backend.onrender.com`).

## Frontend (Vercel)
1. New Project → import repo → set root directory to `frontend/`.
2. Vercel auto-detects Vite via `vercel.json`; confirm build command `npm run build` and output `dist`.
3. Set `VITE_API_BASE_URL` in Vercel's Environment Variables to `<render-backend-url>/api`.
4. Deploy, then confirm the CORS origin: add the resulting Vercel URL to `CORS_ORIGINS` in the Render backend env vars and redeploy the backend.

## Supabase
1. Create tables per Section 7 of the technical spec (`learners`, `learner_profiles`, `roadmaps`, `roadmap_items`, `feedback`).
2. Copy the project URL + anon/service key into `SUPABASE_URL` / `SUPABASE_KEY` in Render.

## Final verification (run right before submission/recording)
```
python qa/e2e/smoke_test.py --base-url https://<your-render-app>.onrender.com/api
```
All checks must print ✅. If anything fails, fix it before recording the demo video — see Section 6 of the team guide: "If something breaks live, cut and re-record rather than showing an error on camera."

## Latency notes
- LLM calls (parse/generate/explain/replan) are the slowest step — budget 3-8s each depending on provider load.
- If Gemini is slow/down, `ai/client.py` automatically falls back to OpenRouter then NVIDIA NIM as long as their keys are set — test this by temporarily unsetting `GEMINI_API_KEY` locally.
