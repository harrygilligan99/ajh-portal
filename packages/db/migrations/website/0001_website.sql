-- ═════════════════════════════════════════════════════════════════════════
-- MODULE: website — uptime_checks (written by the daily cron, Phase 6)
-- ═════════════════════════════════════════════════════════════════════════

create table public.uptime_checks (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  checked_at timestamptz not null default now(),
  ok boolean not null,
  status_code integer,
  response_ms integer,
  error text
);
create index uptime_checks_client_idx on public.uptime_checks(client_id, checked_at desc);

alter table public.uptime_checks enable row level security;

create policy uptime_checks_agency_all on public.uptime_checks
  for all using (public.is_agency()) with check (public.is_agency());

-- clients: read-only (rows written by the cron via service role)
create policy uptime_checks_client_read on public.uptime_checks
  for select using (client_id = public.current_client_id());
