# API Endpoints (frozen — Section 9 of the technical spec)

Base path: `/api`. All request/response bodies validate against the schemas in this folder.

## `POST /api/learner/start`
```json
// req  { "name": "string" }
// res  { "learner_id": "uuid" }
```

## `POST /api/profile/parse`
Calls `ai/client.py::parse_profile()`.
```json
// req  { "learner_id": "uuid", "raw_text": "string" }
// res  {
//   "profile": { ...learner_profile fields, no id... },
//   "missing_fields": ["weekly_time_hours"],
//   "follow_up_question": "string | null"
// }
```

## `POST /api/profile/vark`
Scores a VARK assessment.
```json
// req  { "learner_id": "uuid", "answers": [{ "question_id": "string", "selected_option": "visual | auditory | read_write | kinesthetic" }] }
// res  {
//   "learning_style": {
//     "dominant_style": "visual | auditory | read_write | kinesthetic | multimodal",
//     "scores": { "visual": 0, "auditory": 0, "read_write": 0, "kinesthetic": 0 }
//   }
// }
```

## `POST /api/profile`
Persist the reviewed/edited profile (including learning_style).
```json
// req  { "learner_id": "uuid", ...full learner_profile fields, "learning_style": { "dominant_style": "...", "scores": {...} }... }
// res 201  { "profile_id": "uuid", "profile": { ... } }
```

## `GET /api/profile/{id}`
```json
// res 200  { ...learner_profile... }
// res 404  { "error": "profile_not_found" }
```

## `PUT /api/profile/{id}`
```json
// req  { ...fields to update... }
// res 200  { ...updated learner_profile... }
```

## `POST /api/roadmap/generate`
Profile → retrieval → LLM → persist.
```json
// req  { "profile_id": "uuid" }
// res 201  { "roadmap": { ...roadmap with resource-expanded items... } }
// res 422  { "error": "roadmap_generation_failed", "detail": "string" }
```

## `GET /api/roadmap/{id}`
```json
// res 200 {
//   "id": "uuid", "learner_profile_id": "uuid",
//   "version": "number", "generated_at": "datetime",
//   "items": [
//     { "id": "uuid", "order": "number", "status": "string",
//       "milestone": "boolean", "reason": "string",
//       "resource": { ...full resource object from catalog.json... } }
//   ]
// }
```

## `POST /api/roadmap/{id}/explain`
Calls `ai/client.py::explain_item()`.
```json
// req  { "roadmap_item_id": "uuid" }
// res  { "explanation": "string (2-4 sentences, references profile fields)" }
```

## `POST /api/roadmap/{id}/feedback`
```json
// req  { "roadmap_item_id": "uuid", "action": "complete | skip", "note": "string?" }
// res  {
//   "feedback_id": "uuid", "updated_item_status": "string",
//   "progress_percent": "number", "replan_recommended": "boolean"
// }
```

## `POST /api/roadmap/{id}/replan`
Creates a new roadmap version.
```json
// req  { "roadmap_id": "uuid" }
// res  { "roadmap": { ...new version... }, "changes_summary": "string" }
```

## `POST /api/auth/register`
```json
// req  { "name": "string", "username": "string", "password": "string" }
// res 201 { "learner_id": "uuid", "name": "string", "username": "string" }
```

## `POST /api/auth/login`
```json
// req  { "username": "string", "password": "string" }
// res 200 { "learner_id": "uuid", "name": "string", "username": "string", "profile_id": "uuid | null", "roadmap_id": "uuid | null" }
```

## `POST /api/mentor/chat`
```json
// req  { "message": "string", "learner_profile_id": "uuid?", "roadmap_id": "uuid?" }
// res 200 { "reply": "string" }
```

## `GET /api/learner/{learner_id}/roadmaps`
```json
// res 200 { "roadmaps": [ { "id": "uuid", "roadmap_id": "uuid", "learner_profile_id": "uuid", "goal": "string", "goal_type": "string", "experience_level": "string", "percentage": "number", "total_items": "number", "completed_items": "number", "total_hours": "number", "completed_hours": "number", "is_completed": "boolean", "version": "number" } ] }
```

## `PATCH /api/learner/{learner_id}/theme`
```json
// req  { "theme": "light | dark | system" }
// res 200 { "ok": true, "learner_id": "uuid", "theme": "string" }
```

## `GET /api/health`
```json
// res  { "status": "ok" }
```

---
**Rule:** this file and the `*.schema.json` files in this folder define standardized API contracts.
