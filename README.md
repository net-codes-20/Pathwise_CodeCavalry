# Pathwise — AI-Powered Personalized Learning Path Recommender

> An intelligent, adaptive learning path recommendation platform that sequences personalized curricula, adapts dynamically to learner progress, and provides grounded AI mentorship across 11 technical domains and 435+ curated modules.

---

- **Demo Video Link:** [https://youtu.be/ciNSB9K078Y](https://youtu.be/ciNSB9K078Y)
- **Project Presentation Deck (PDF):** [Pathwise Presentation.pdf](docs/Pathwise%20Presentation.pdf) 

## 🌟 Key Features

1. **Intelligent Onboarding & Goal Parsing**:
   - **8 Goal Objectives**: Land a Job, Secure an Internship, Career Switch, Learn a New Skill, Build a Real Project, Academic/Research, Certification Prep, and Interview Prep.
   - **Contextual Role & Focus Selector**: Dynamic dropdown choices tailored to the selected objective, plus custom write-in support.
   - **Official 20-Question VARK Assessment**: Evaluates Visual, Auditory, Reading/Writing, and Kinesthetic learning modalities to customize coursework formats.
   - **Real-Time Draft Recovery**: Auto-saves onboarding state so learners never lose progress.

2. **Grounded Roadmap Generation & Sequencing**:
   - **Deterministic Candidate Retrieval**: Prerequisite-aware candidate ranking over a catalog of **435 courses across 11 domains**.
   - **Grounded AI Sequencing**: Strict hallucination guardrails guarantee every recommended module maps to a real catalog course.
   - **Contextual "Why this?" Explanations**: Deep explanations referencing the learner's background, learning style, and milestone requirements.

3. **Multi-Goal & Roadmap Management**:
   - **Persistent Multi-Roadmap History**: Create and preserve multiple learning goals in Supabase.
   - **Seamless Goal Switching**: Switch between active pathways from **Settings & Goals** (`/app/settings`) without losing progress.
   - **Continuous Re-planning (`🔄 Replan`)**: Re-synthesize existing pathways incorporating newly acquired competencies.

4. **Dynamic Skills Analytics & Growth Tracking**:
   - **Coursework Skills Acquisition**: Automatically upgrades acquired skills with `✓ Coursework` tags as modules are finished.
   - **Dynamic Skill Gap Shrinkage**: Real-time recalculation of remaining competency gaps.

5. **24/7 Roadmap-Scoped AI Mentor**:
   - Project-scoped conversational assistant preserving isolated chat history for each specific roadmap.
   - Context-aware tutor referencing active modules, upcoming milestones, and VARK learning preferences.

6. **Modern Design System & Dark Mode**:
   - Built with React 18, Vite, and Tailwind CSS.
   - Persistent **Light**, **Dark**, and **System** UI theme support synced with Supabase.

---

## 📚 Curriculum Catalog Overview

The platform includes **435 curated modules** across **11 domains**:

| Domain | Modules | Focus Areas |
|---|:---:|---|
| `ai_ml` | 50 | LLMs, PyTorch, LangChain, AI Agents, Neural Networks, Computer Vision |
| `web_development` | 50 | React, Next.js, Node.js, Express, TypeScript, REST APIs, Modern CSS |
| `data_science` | 46 | Pandas, NumPy, Data Analysis, SQL, Data Visualization, Statistics |
| `devops` | 37 | Docker, Kubernetes, CI/CD Pipelines, Terraform, Ansible, Infrastructure |
| `mobile_development` | 37 | Flutter, React Native, iOS/Android Architecture, Cross-Platform |
| `cloud` | 36 | AWS, Google Cloud, Azure, Serverless, Cloud Architecture |
| `cybersecurity` | 36 | OWASP, Ethical Hacking, Network Security, SOC Operations |
| `game_development` | 36 | Unity, Unreal Engine, C#, Game Physics & Systems Design |
| `iot_embedded` | 36 | Arduino, Raspberry Pi, Embedded C/C++, Sensors, MQTT |
| `software_engineering` | 36 | Clean Code, Design Patterns, SOLID Principles, System Architecture |
| `interview_prep` | 35 | DSA, LeetCode Patterns, System Design, Technical Screen Strategies |
| **Total** | **435** | |

---

## 🏗️ Monorepo Architecture

```
course_suggestion_CodeCavalry/
├── frontend/             # React 18 + Vite + Tailwind CSS UI application
├── backend/              # FastAPI + Pydantic + Supabase Database service
│   ├── app/
│   │   ├── db/           # Supabase schemas (schema.sql, seed_courses.sql, seed_vark_questions.sql)
│   │   ├── models/       # Pydantic request/response validation models
│   │   ├── routes/       # API route controllers (auth, learner, profile, roadmap, mentor, health)
│   │   └── services/     # Core domain orchestration services
├── ai/                   # Multi-provider LLM Engine (Gemini, OpenRouter, NIM) + Grounded Prompts
├── recommender/          # Deterministic Candidate Retrieval & Ranking Engine
│   └── catalog/          # Centralized catalog dataset (catalog.json)
├── contracts/            # Frozen API specifications & JSON Schemas
├── qa/                   # End-to-end smoke tests, evaluation personas & deploy configs
├── docs/                 # System architecture & Supabase setup guides
├── requirements.txt      # Centralized Python dependencies
├── .env.example          # Environment variable template
└── README.md             # Project documentation
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Python 3.10+**
- **Node.js 18+** & `npm`
- **Supabase Account** (Free tier is sufficient)
- **AI API Key** (Google Gemini recommended; OpenRouter and NVIDIA NIM also supported)

---

### 2. Environment Setup

Copy `.env.example` to create `.env` at the root of the repository:

```bash
cp .env.example .env
```

Configure your environment variables:
```env
# Supabase Database Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key

# AI Provider API Keys
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

---

### 3. Database Initialization (Supabase)

Execute the 3 SQL scripts located in [`backend/app/db/`](backend/app/db/) in your Supabase **SQL Editor** in the following order:

1. **`schema.sql`**: Creates tables (`learners`, `learner_profiles`, `roadmaps`, `roadmap_items`, `feedback`, `courses`, `vark_questions`), indexes, and triggers.
2. **`seed_vark_questions.sql`**: Populates the official 20-question VARK assessment questionnaire.
3. **`seed_courses.sql`**: Populates the 435 curated modules across all 11 technical domains.

---

### 4. Backend Setup & Run

```bash
# Create and activate virtual environment
python -m venv venv

# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# macOS / Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the FastAPI server
cd backend
uvicorn app.main:app --reload --port 8000
```
- **Interactive Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health Check**: [http://localhost:8000/api/health](http://localhost:8000/api/health)

---

### 5. Frontend Setup & Run

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
```
- Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🧪 Verification & Testing

- **Backend Unit Tests**:
  ```bash
  pytest backend/tests -v
  ```
- **Recommender Unit Tests**:
  ```bash
  pytest recommender/tests/ -v
  ```
- **Frontend Production Build**:
  ```bash
  cd frontend && npm run build
  ```

---

## 📖 Documentation Links

- [System Architecture](docs/architecture.md)
- [Supabase Setup Guide](docs/SUPABASE_SETUP.md)
- [API Contract Specification](contracts/api_endpoints.md)
- [Database Schema SQL](backend/app/db/schema.sql)
- [Course Catalog Seed SQL](backend/app/db/seed_courses.sql)
- [VARK Questions Seed SQL](backend/app/db/seed_vark_questions.sql)
