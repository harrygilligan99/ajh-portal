-- ═════════════════════════════════════════════════════════════════════════
-- MODULE: documents — contract / welcome pack / reports vault
-- Contract acceptance (Phase 3) sets status/accepted_* via a server action.
-- ═════════════════════════════════════════════════════════════════════════

create type public.document_kind as enum ('contract','welcome_pack','invoice','report','other');
create type public.document_status as enum ('draft','sent','viewed','accepted');

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  kind public.document_kind not null default 'other',
  title text not null,
  storage_path text not null,
  status public.document_status not null default 'draft',
  accepted_at timestamptz,
  accepted_by uuid references auth.users(id) on delete set null,
  accepted_name_typed text,
  created_at timestamptz not null default now()
);
create index documents_client_idx on public.documents(client_id, created_at desc);

alter table public.documents enable row level security;

create policy documents_agency_all on public.documents
  for all using (public.is_agency()) with check (public.is_agency());

-- clients: read-only (documents are generated/uploaded by the agency or system)
create policy documents_client_read on public.documents
  for select using (client_id = public.current_client_id());
