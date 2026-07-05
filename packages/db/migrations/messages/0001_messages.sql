-- ═════════════════════════════════════════════════════════════════════════
-- MODULE: messages — one general thread per client
-- ═════════════════════════════════════════════════════════════════════════

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  sender_id uuid references auth.users(id) on delete set null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index messages_client_idx on public.messages(client_id, created_at desc);

alter table public.messages enable row level security;

create policy messages_agency_all on public.messages
  for all using (public.is_agency()) with check (public.is_agency());

create policy messages_client_read on public.messages
  for select using (client_id = public.current_client_id());

create policy messages_client_insert on public.messages
  for insert with check (
    client_id = public.current_client_id()
    and sender_id = auth.uid()
  );
