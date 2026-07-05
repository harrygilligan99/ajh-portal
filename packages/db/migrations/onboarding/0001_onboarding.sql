-- ═════════════════════════════════════════════════════════════════════════
-- MODULE: onboarding — onboarding_responses, access_grants
-- NOTE: passwords are NEVER stored anywhere in this system. Access is always
-- granted via provider-native invite / delegate / transfer flows.
-- ═════════════════════════════════════════════════════════════════════════

create type public.grant_provider as enum ('domain','hosting','google_analytics','google_business','meta','other');
create type public.grant_method as enum ('invite','delegate','transfer');
create type public.grant_status as enum ('requested','pending_client','granted','not_applicable');

create table public.onboarding_responses (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);
create index onboarding_responses_client_idx on public.onboarding_responses(client_id);

create table public.access_grants (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  provider public.grant_provider not null,
  account_identifier text,
  method public.grant_method not null default 'invite',
  status public.grant_status not null default 'requested',
  notes text,
  created_at timestamptz not null default now()
);
create index access_grants_client_idx on public.access_grants(client_id);

-- ── RLS ────────────────────────────────────────────────────────────────────
alter table public.onboarding_responses enable row level security;

create policy onboarding_responses_agency_all on public.onboarding_responses
  for all using (public.is_agency()) with check (public.is_agency());

create policy onboarding_responses_client_read on public.onboarding_responses
  for select using (client_id = public.current_client_id());

create policy onboarding_responses_client_insert on public.onboarding_responses
  for insert with check (client_id = public.current_client_id());

alter table public.access_grants enable row level security;

create policy access_grants_agency_all on public.access_grants
  for all using (public.is_agency()) with check (public.is_agency());

create policy access_grants_client_read on public.access_grants
  for select using (client_id = public.current_client_id());

create policy access_grants_client_insert on public.access_grants
  for insert with check (client_id = public.current_client_id());
