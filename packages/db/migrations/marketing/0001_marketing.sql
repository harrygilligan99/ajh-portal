-- ═════════════════════════════════════════════════════════════════════════
-- MODULE: marketing — ad_spend (manually entered by agency staff)
-- ═════════════════════════════════════════════════════════════════════════

create type public.ad_platform as enum ('meta','google','other');

create table public.ad_spend (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  month date not null,
  platform public.ad_platform not null,
  spend_pennies integer not null default 0,
  clicks integer not null default 0,
  impressions integer not null default 0,
  leads integer not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  constraint ad_spend_month_is_first_day check (extract(day from month) = 1),
  unique (client_id, month, platform)
);
create index ad_spend_client_idx on public.ad_spend(client_id, month desc);

alter table public.ad_spend enable row level security;

create policy ad_spend_agency_all on public.ad_spend
  for all using (public.is_agency()) with check (public.is_agency());

-- clients: read-only
create policy ad_spend_client_read on public.ad_spend
  for select using (client_id = public.current_client_id());
