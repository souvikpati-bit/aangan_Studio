-- Calls we started (or imported) and are waiting to collect from Vaani once its post-call processing is done.
create table if not exists pending_calls (
  room_name text primary key,              -- same value as Vaani's call id
  source text not null default 'talk',     -- talk | import
  created_at timestamptz not null default now(),
  finished_at timestamptz,                 -- when the caller pressed End
  processed_at timestamptz,
  attempts int not null default 0,
  last_error text
);
