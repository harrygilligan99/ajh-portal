-- ═════════════════════════════════════════════════════════════════════════
-- MODULE: billing — invoices (synced from Stripe webhooks, Phase 5)
-- status mirrors Stripe invoice status strings (draft/open/paid/void/uncollectible)
-- ═════════════════════════════════════════════════════════════════════════

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  stripe_invoice_id text not null unique,
  amount_pennies integer not null,
  status text not null,
  hosted_invoice_url text,
  pdf_url text,
  issued_at timestamptz,
  created_at timestamptz not null default now()
);
create index invoices_client_idx on public.invoices(client_id, issued_at desc);

alter table public.invoices enable row level security;

create policy invoices_agency_all on public.invoices
  for all using (public.is_agency()) with check (public.is_agency());

create policy invoices_client_read on public.invoices
  for select using (client_id = public.current_client_id());
