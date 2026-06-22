create table if not exists tst_interview_templates (
  id text primary key,
  name text not null,
  role text not null,
  config_json jsonb not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists tst_interview_sessions (
  id text primary key,
  candidate_id text not null,
  template_id text not null references tst_interview_templates(id),
  status text not null check (status in ('in_progress', 'completed', 'failed')),
  current_stage text not null,
  turn_count int not null default 0,
  compact_summary_json jsonb not null default '{}'::jsonb,
  slot_state_json jsonb not null default '{}'::jsonb,
  asked_question_ids_json jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_tst_interview_sessions_candidate on tst_interview_sessions(candidate_id);
create index if not exists idx_tst_interview_sessions_status on tst_interview_sessions(status);

create table if not exists tst_interview_turns (
  id text primary key,
  session_id text not null references tst_interview_sessions(id),
  question_id text not null,
  question_json jsonb not null,
  answer_raw_json jsonb,
  answer_normalized_json jsonb,
  extracted_signals_json jsonb,
  latency_ms int,
  token_usage_json jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_tst_interview_turns_session on tst_interview_turns(session_id, created_at desc);

create table if not exists tst_final_reports (
  id text primary key,
  session_id text unique not null references tst_interview_sessions(id),
  report_json jsonb not null,
  recommendation text not null,
  created_at timestamptz not null default now()
);

create table if not exists tst_interview_telemetry (
  id text primary key,
  session_id text not null references tst_interview_sessions(id),
  turn_id text references tst_interview_turns(id),
  event_type text not null,
  payload_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
