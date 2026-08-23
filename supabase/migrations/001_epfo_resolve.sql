-- Run in the Supabase SQL editor before enabling production persistence.
create table if not exists public.cases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scenario_key text not null default 'ananya-eps-correction',
  status text not null check (status in ('transfer_failed','diagnosed','evidence_ready','correction_submitted','employer_overdue','escalated','reconciled','transfer_completed')),
  locale text not null default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, scenario_key)
);
create table if not exists public.case_events (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  event_key text not null,
  event_type text not null,
  actor text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (case_id, event_key)
);
create table if not exists public.evidence_selections (
  case_id uuid not null references public.cases(id) on delete cascade,
  evidence_id text not null check (evidence_id in ('appointment','payslips','service','passbook','form3a','email')),
  created_at timestamptz not null default now(),
  primary key (case_id, evidence_id)
);
create table if not exists public.ai_artifacts (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  kind text not null check (kind in ('explain','draft','translate')),
  source text not null check (source in ('live','fallback')),
  output text not null,
  created_at timestamptz not null default now()
);
alter table public.cases enable row level security;
alter table public.case_events enable row level security;
alter table public.evidence_selections enable row level security;
alter table public.ai_artifacts enable row level security;
create policy "anonymous users own their cases" on public.cases for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users read their case events" on public.case_events for all using (exists (select 1 from public.cases where cases.id = case_events.case_id and cases.user_id = auth.uid())) with check (exists (select 1 from public.cases where cases.id = case_events.case_id and cases.user_id = auth.uid()));
create policy "users manage their evidence" on public.evidence_selections for all using (exists (select 1 from public.cases where cases.id = evidence_selections.case_id and cases.user_id = auth.uid())) with check (exists (select 1 from public.cases where cases.id = evidence_selections.case_id and cases.user_id = auth.uid()));
create policy "users read their AI artifacts" on public.ai_artifacts for all using (exists (select 1 from public.cases where cases.id = ai_artifacts.case_id and cases.user_id = auth.uid())) with check (exists (select 1 from public.cases where cases.id = ai_artifacts.case_id and cases.user_id = auth.uid()));
