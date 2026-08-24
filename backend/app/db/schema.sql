-- ============================================================================
-- Learning Path Recommender — Supabase (PostgreSQL) Schema
-- Run this once in your Supabase project: SQL Editor → New query → paste → Run
-- Column names match backend/app/db/queries.py exactly. Safe to re-run
-- (all statements are IF NOT EXISTS / OR REPLACE where possible).
-- ============================================================================

create extension if not exists "pgcrypto"; -- provides gen_random_uuid()

-- ---- 1. central courses / learning resources catalog -----------------------
-- Central repository for all courses, projects, articles, and interactive exercises
create table if not exists courses (
  id text primary key,               -- e.g. 'wd-001', 'ai-001', 'py-001'
  title text not null,
  description text,
  type text not null default 'course', -- 'course', 'video', 'practice', 'project', 'article'
  url text,
  duration_hours numeric default 5,
  level text not null default 'beginner' check (level in ('beginner', 'intermediate', 'advanced')),
  domain text not null,              -- 'web_development', 'ai_ml', 'data_science', 'devops', etc.
  tags jsonb not null default '[]'::jsonb,
  prerequisites jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_courses_domain on courses(domain);
create index if not exists idx_courses_level on courses(level);

-- ---- 2. vark_questions (official 20-question questionnaire) ----------------
create table if not exists vark_questions (
  id text primary key,               -- e.g. 'q1' to 'q20'
  question_number integer not null,
  question_text text not null,
  option_v text not null,
  option_a text not null,
  option_r text not null,
  option_k text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_vark_questions_number on vark_questions(question_number);

-- ---- 3. learners -----------------------------------------------------------
-- Unique user accounts with credentials and persistent UI theme preferences
create table if not exists learners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  username text unique,
  password_hash text,
  theme text not null default 'light' check (theme in ('light', 'dark', 'system')),
  created_at timestamptz not null default now()
);

-- ---- 4. learner_profiles ----------------------------------------------------
-- Individual user learning goals, skills, time commitments, and VARK learning styles
create table if not exists learner_profiles (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references learners(id) on delete cascade,
  goal text not null,
  goal_type text not null check (goal_type in (
    'internship', 'job', 'new_skill', 'project', 'interview_prep',
    'academic', 'career_transition', 'certification'
  )),
  experience_level text not null check (experience_level in (
    'beginner', 'intermediate', 'advanced'
  )),
  current_skills jsonb not null default '[]'::jsonb,
  interests jsonb not null default '[]'::jsonb,
  timeline_months numeric,
  weekly_time_hours numeric,
  constraints jsonb not null default '[]'::jsonb,
  dominant_style text,
  vark_scores jsonb,
  vark_raw_string text,              -- 20-char compact string sequence (e.g. 'VARKVARAKVVRKAVRAKVR')
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_learner_profiles_learner_id on learner_profiles(learner_id);

-- keep updated_at current on every UPDATE
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_learner_profiles_updated_at on learner_profiles;
create trigger trg_learner_profiles_updated_at
  before update on learner_profiles
  for each row execute function set_updated_at();

-- ---- 4. roadmaps ------------------------------------------------------------
-- Personalized roadmap sequence versions generated for each learner profile
create table if not exists roadmaps (
  id uuid primary key default gen_random_uuid(),
  learner_profile_id uuid not null references learner_profiles(id) on delete cascade,
  version integer not null default 1,
  generated_at timestamptz not null default now()
);
create index if not exists idx_roadmaps_profile_id on roadmaps(learner_profile_id);
create unique index if not exists uq_roadmap_profile_version on roadmaps(learner_profile_id, version);

-- ---- 5. roadmap_items ---------------------------------------------------------
-- Individual courses / milestones assigned to a user's roadmap (linking to courses table)
create table if not exists roadmap_items (
  id uuid primary key default gen_random_uuid(),
  roadmap_id uuid not null references roadmaps(id) on delete cascade,
  resource_id text not null,        -- references courses(id)
  "order" integer not null,
  status text not null default 'upcoming' check (status in (
    'upcoming', 'current', 'completed', 'skipped'
  )),
  milestone boolean not null default false,
  reason text
);
create index if not exists idx_roadmap_items_roadmap_id on roadmap_items(roadmap_id);
create unique index if not exists uq_roadmap_item_order on roadmap_items(roadmap_id, "order");

-- ---- 6. feedback -----------------------------------------------------------
-- Feedback events when learners complete or skip roadmap milestones
create table if not exists feedback (
  id uuid primary key default gen_random_uuid(),
  roadmap_item_id uuid not null references roadmap_items(id) on delete cascade,
  action text not null check (action in ('complete', 'skip')),
  note text,
  "timestamp" timestamptz not null default now()
);
create index if not exists idx_feedback_roadmap_item_id on feedback(roadmap_item_id);

-- ============================================================================
-- Row Level Security — disabled for prototype backend service role
-- ============================================================================
alter table if exists courses disable row level security;
alter table if exists vark_questions disable row level security;
alter table if exists learners disable row level security;
alter table if exists learner_profiles disable row level security;
alter table if exists roadmaps disable row level security;
alter table if exists roadmap_items disable row level security;
alter table if exists feedback disable row level security;

-- ============================================================================
-- MIGRATIONS — safe to run on an existing database
-- ============================================================================

-- learners: add username, password_hash, and theme
alter table learners add column if not exists username text unique;
alter table learners add column if not exists password_hash text;
alter table learners add column if not exists theme text not null default 'light';

-- learner_profiles: add VARK learning style fields and compact raw string
alter table learner_profiles add column if not exists dominant_style text;
alter table learner_profiles add column if not exists vark_scores jsonb;
alter table learner_profiles add column if not exists vark_raw_string text;
