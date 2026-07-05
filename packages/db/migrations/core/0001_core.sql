-- ═════════════════════════════════════════════════════════════════════════
-- CORE: enums, clients, profiles, RLS helpers, profile trigger,
--       cross-cutting tables (activity_log, scheduled_emails, email_log)
-- ═════════════════════════════════════════════════════════════════════════

create type public.client_status as enum ('lead','onboarding','active','paused','archived');
create type public.client_plan as enum ('starter','standard','pro');
create type public.profile_role as enum ('agency_admin','agency_member','client_owner','client_member');

-- ── clients ────────────────────────────────────────────────────────────────
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  status public.client_status not null default 'lead',
  plan public.client_plan not null default 'starter',
  marketing_plan boolean not null default false,
  branding jsonb not null default jsonb_build_object('logo_url', null, 'primary_color', '#0f172a'),
  enabled_modules jsonb not null default '["onboarding","requests","messages","billing","marketing","documents","website"]'::jsonb,
  monthly_update_quota integer not null default 4,
  website_url text,
  domain_registrar text,
  domain_renewal_date date,
  hosting_notes text,
  stripe_customer_id text unique,
  created_at timestamptz not null default now()
);

-- ── profiles ───────────────────────────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role public.profile_role not null default 'client_member',
  client_id uuid references public.clients(id) on delete set null,
  created_at timestamptz not null default now(),
  -- agency staff never belong to a client
  constraint profiles_agency_has_no_client check (
    role in ('client_owner','client_member') or client_id is null
  )
);
create index profiles_client_id_idx on public.profiles(client_id);

-- ── RLS helper functions ───────────────────────────────────────────────────
-- security definer so they can read profiles without tripping profiles' own RLS
create or replace function public.is_agency() returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('agency_admin','agency_member')
  );
$$;

create or replace function public.current_client_id() returns uuid
language sql stable security definer set search_path = public
as $$
  select client_id from public.profiles where id = auth.uid();
$$;

-- ── profile auto-creation on invite/signup ─────────────────────────────────
-- role + client_id come from raw_user_meta_data, which only our server-side
-- invite flows set (public signups are disabled). Unknown role → client_member
-- with no client, i.e. no access to anything.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_role public.profile_role;
  v_client uuid;
begin
  if new.raw_user_meta_data->>'role' in ('agency_admin','agency_member','client_owner','client_member') then
    v_role := (new.raw_user_meta_data->>'role')::public.profile_role;
  else
    v_role := 'client_member';
  end if;

  if v_role in ('agency_admin','agency_member') then
    v_client := null;
  else
    v_client := nullif(new.raw_user_meta_data->>'client_id', '')::uuid;
  end if;

  insert into public.profiles (id, full_name, role, client_id)
  values (new.id, new.raw_user_meta_data->>'full_name', v_role, v_client)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── RLS: clients ───────────────────────────────────────────────────────────
alter table public.clients enable row level security;

create policy clients_agency_all on public.clients
  for all using (public.is_agency()) with check (public.is_agency());

create policy clients_own_read on public.clients
  for select using (id = public.current_client_id());

-- ── RLS: profiles ──────────────────────────────────────────────────────────
alter table public.profiles enable row level security;

create policy profiles_agency_all on public.profiles
  for all using (public.is_agency()) with check (public.is_agency());

create policy profiles_self_read on public.profiles
  for select using (id = auth.uid());

create policy profiles_same_client_read on public.profiles
  for select using (client_id is not null and client_id = public.current_client_id());

create policy profiles_self_update on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- Column-level guard: through the API a user can only change their own
-- full_name — never role or client_id (role management goes through
-- service-role server actions).
revoke update on public.profiles from authenticated, anon;
grant update (full_name) on public.profiles to authenticated;

-- ── activity_log (agency-only) ─────────────────────────────────────────────
create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  verb text not null,
  subject_type text,
  subject_id uuid,
  created_at timestamptz not null default now()
);
create index activity_log_client_idx on public.activity_log(client_id, created_at desc);

alter table public.activity_log enable row level security;
create policy activity_log_agency_all on public.activity_log
  for all using (public.is_agency()) with check (public.is_agency());

-- ── scheduled_emails (agency-only; written by system) ──────────────────────
create table public.scheduled_emails (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete cascade,
  template text not null,
  payload jsonb not null default '{}'::jsonb,
  send_at timestamptz not null,
  sent_at timestamptz,
  resend_id text,
  created_at timestamptz not null default now()
);
create index scheduled_emails_due_idx on public.scheduled_emails(send_at) where sent_at is null;

alter table public.scheduled_emails enable row level security;
create policy scheduled_emails_agency_all on public.scheduled_emails
  for all using (public.is_agency()) with check (public.is_agency());

-- ── email_log (agency-only; written by system) ─────────────────────────────
create table public.email_log (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete set null,
  template text not null,
  to_email text not null,
  resend_id text,
  status text not null default 'sent',
  sent_at timestamptz not null default now()
);
create index email_log_client_idx on public.email_log(client_id, sent_at desc);

alter table public.email_log enable row level security;
create policy email_log_agency_all on public.email_log
  for all using (public.is_agency()) with check (public.is_agency());
