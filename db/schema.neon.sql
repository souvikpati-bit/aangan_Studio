-- Aangan Studio - Postgres schema for Neon. All timestamps are UTC (timestamptz); show in IST in the UI.
-- Access control (designer / front_desk / founder) is enforced in the app; the database is only reachable server-side.
create extension if not exists pgcrypto;

create type app_role as enum ('designer', 'front_desk', 'founder');
create type verdict_t as enum ('Qualified', 'Not qualified', 'Needs human', 'Escalate', 'Missed', 'Closed');
create type lead_status as enum ('New', 'Contacted', 'Meeting held', 'Won', 'Lost');

create table users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text,
  role app_role not null default 'designer',
  password_hash text,
  created_at timestamptz not null default now()
);

create table designers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  cal_username text,
  bookable_hours jsonb not null default '{}'::jsonb
);

create table leads (
  id uuid primary key default gen_random_uuid(),
  ref text unique,                         -- short id shown in the UI (e.g. T01)
  phone text unique,                       -- dedupe + history key (null if withheld)
  name text, property_type text, home_kind text, locality text, sqft int,
  property_line text,
  scope text, current_state text, timeline_text text, needed_by date,
  budget_text text, source text, referrer text,
  price_asked boolean not null default false,
  decision_maker_note text, consult_mode text, site_address text, availability text,
  follow_up boolean not null default false, follow_up_date date, follow_up_note text,
  status lead_status not null default 'New',
  lead_flags text[] not null default '{}',   -- VIP, high_value, service_recovery, price_asked, tight_timeline, adjoining_area
  asked text[] not null default '{}',        -- questions already asked (designer must not repeat)
  merged_from_call_ids text[] not null default '{}',
  designer_id uuid references designers(id),
  deal_value_inr bigint,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  viewed_at timestamptz
);

create table calls (
  id uuid primary key default gen_random_uuid(),
  vaani_call_id text unique not null,        -- idempotency key
  lead_id uuid references leads(id),
  from_number text, caller_id_hidden boolean not null default false,
  started_at timestamptz not null, ended_at timestamptz, duration_s int,
  called_at_text text, duration_text text,   -- display strings for imported/sample calls
  summary text,
  answered_by text check (answered_by in ('ai', 'front_desk', 'none')),
  first_response_at timestamptz,             -- AI pickup or missed-call SMS delivered
  recording_url text, transcript text,
  language text, stt_confidence numeric,
  call_type text, recording_declined boolean not null default false,
  ai_disclosed boolean not null default false,
  raw jsonb,
  created_at timestamptz not null default now()
);

create table config_versions (
  id uuid primary key default gen_random_uuid(),
  prompt_version text, rubric_version text, settings jsonb,
  created_at timestamptz not null default now()
);

create table qualification_results (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id), call_id uuid references calls(id),
  c1 jsonb, c2 jsonb, c3 jsonb, c4 jsonb, c5 jsonb,   -- {result, note, confidence, evidence}
  verdict verdict_t not null, reason text, score int,
  notes text[], question text,
  config_version_id uuid references config_versions(id),
  overridden_by uuid references users(id), override_reason text,
  created_at timestamptz not null default now()
);

create table meetings (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id) not null,
  cal_booking_uid text unique,               -- Cal.com booking id
  starts_at timestamptz, ends_at timestamptz,
  slot_text text,                            -- display text for sample bookings
  mode text check (mode in ('site_visit', 'call')), address text,
  status text not null default 'booked' check (status in ('booked', 'rescheduled', 'cancelled', 'no_show', 'held')),
  created_at timestamptz not null default now()
);

create table escalations (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id), call_id uuid references calls(id),
  summary text,
  promised_minutes int not null default 15,
  promised_callback_at timestamptz,
  acknowledged_at timestamptz, acknowledged_by uuid references users(id),
  chain_level int not null default 0,
  created_at timestamptz not null default now()
);

create table needs_human (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id), call_id uuid references calls(id),
  reason text, due_at timestamptz, done_at timestamptz,
  created_at timestamptz not null default now()
);

create table notifications_log (
  id uuid primary key default gen_random_uuid(),
  kind text not null,              -- brief | digest | escalation | sms_mock | failure
  to_addr text, lead_id uuid references leads(id), call_id uuid references calls(id),
  dedupe_key text unique,          -- stops duplicate sends
  status text, body text, sent_at timestamptz default now(), viewed_at timestamptz
);

create table cost_log (
  id uuid primary key default gen_random_uuid(),
  call_id uuid references calls(id),
  voice_min numeric, llm_input_tokens int, llm_output_tokens int,
  sms_count int default 0, email_count int default 0,
  inr_cost numeric, created_at timestamptz not null default now()
);

create table hubspot_sync_log (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id), entity text, hubspot_id text,
  status text, retries int default 0, error text,
  created_at timestamptz not null default now()
);

create table audit_log (
  id bigserial primary key,
  actor uuid, action text not null, target text, reason text,
  at timestamptz not null default now()
);

create index on calls (lead_id);
create index on qualification_results (lead_id);
create index on meetings (lead_id);
create index on leads (status);

-- See db/migrations/002_pending_calls.sql
create table if not exists pending_calls (
  room_name text primary key,
  source text not null default 'talk',
  created_at timestamptz not null default now(),
  finished_at timestamptz,
  processed_at timestamptz,
  attempts int not null default 0,
  last_error text
);
