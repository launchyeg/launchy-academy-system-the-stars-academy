-- The Stars Academy — canonical Supabase schema
--
-- This file always reflects the CURRENT, full state of the database — run it
-- top-to-bottom against a fresh Supabase project (SQL Editor → New query →
-- paste → Run) and you get an exact, ready-to-use copy of the schema:
-- groups/students/subscriptions tables, foreign keys, and RLS policies.
--
-- Convention for changing the schema:
--   1. Add a new, dated file under supabase/migrations/ containing ONLY the
--      incremental change (e.g. `alter table ...`), so there's a record of
--      what changed and when.
--   2. Fold that same change into this file, so schema.sql always matches
--      what a brand new project should look like — never let the two drift.
--
-- See supabase/README.md for the full explanation of this layout.

create table if not exists groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references groups(id) on delete set null,
  name text not null,
  phone text,
  parent_phone text,
  price numeric,
  created_at timestamptz not null default now()
);

create table if not exists subscriptions (
  id uuid primary key,  -- generated client-side via crypto.randomUUID(), no default needed
  student_id uuid not null references students(id) on delete cascade,
  start_date date,
  end_date date,
  payment_method text,
  paid boolean not null default true,
  attendance boolean[] not null default array_fill(false, array[8]),
  quizzes text[] not null default array_fill(''::text, array[8]),
  final_exam text default '',
  note text default '',
  created_at timestamptz not null default now()
);

alter table groups enable row level security;
alter table students enable row level security;
alter table subscriptions enable row level security;

-- Single-admin app: any authenticated request may do anything; anonymous is blocked.
create policy "authenticated full access" on groups
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on students
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on subscriptions
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
