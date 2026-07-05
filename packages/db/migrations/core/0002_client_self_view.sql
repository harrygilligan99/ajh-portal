-- ═════════════════════════════════════════════════════════════════════════
-- Client column privacy.
--
-- Agency and client users share the `authenticated` Postgres role, so a
-- column-level GRANT can't hide columns from clients without also hiding them
-- from agency staff. The original clients_own_read policy therefore let a client
-- read EVERY column of their own row via direct PostgREST — including
-- agency-internal fields (stripe_customer_id, hosting_notes, domain_registrar,
-- domain_renewal_date). Fix: drop the client read policy on the base table and
-- expose client-safe columns through an owner-privileged view scoped to
-- current_client_id(). Agency keeps full base-table access via clients_agency_all.
-- ═════════════════════════════════════════════════════════════════════════

drop policy if exists clients_own_read on public.clients;

-- security_invoker = off (the default): the view runs with its owner's rights,
-- bypassing the base table's RLS, while the WHERE clause restricts rows to the
-- caller's own client. Only safe columns are selectable.
create or replace view public.client_self
with (security_invoker = off) as
  select
    id,
    name,
    slug,
    status,
    plan,
    marketing_plan,
    branding,
    enabled_modules,
    monthly_update_quota,
    website_url
  from public.clients
  where id = public.current_client_id();

grant select on public.client_self to authenticated;
