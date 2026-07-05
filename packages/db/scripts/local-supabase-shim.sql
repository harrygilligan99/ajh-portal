-- ═════════════════════════════════════════════════════════════════════════
-- LOCAL-ONLY Supabase compatibility shim.
--
-- Recreates the slice of a hosted Supabase project that our migrations assume
-- already exists: the anon/authenticated/service_role roles, the `auth` schema
-- with a minimal auth.users table + auth.uid()/auth.role() reading
-- request.jwt.claims, and the default table/function grants Supabase applies at
-- project creation. This lets the REAL, UNMODIFIED migrations run against a
-- plain local Postgres so we can exercise RLS the same way PostgREST does
-- (SET ROLE authenticated + SET request.jwt.claims). NEVER run against a real
-- Supabase project — it is not needed there.
-- ═════════════════════════════════════════════════════════════════════════

-- Roles (NOLOGIN, switched into via SET ROLE). service_role bypasses RLS,
-- exactly like Supabase.
do $$ begin
  if not exists (select from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
  if not exists (select from pg_roles where rolname = 'service_role') then
    create role service_role nologin bypassrls;
  end if;
end $$;

grant usage on schema public to anon, authenticated, service_role;

-- Default privileges applied BEFORE migrations create objects, so every table
-- and function our migrations create is reachable by anon/authenticated and
-- then gated purely by RLS — mirroring Supabase's project bootstrap ordering.
alter default privileges in schema public
  grant select, insert, update, delete on tables to anon, authenticated;
alter default privileges in schema public
  grant usage, select on sequences to anon, authenticated;
alter default privileges in schema public
  grant execute on functions to anon, authenticated;

-- Minimal auth schema.
create schema if not exists auth;
grant usage on schema auth to anon, authenticated, service_role;

create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  raw_user_meta_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function auth.uid() returns uuid
language sql stable
as $$
  select (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')::uuid;
$$;

create or replace function auth.role() returns text
language sql stable
as $$
  select nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role';
$$;

grant execute on function auth.uid() to anon, authenticated, service_role;
grant execute on function auth.role() to anon, authenticated, service_role;
