-- ═════════════════════════════════════════════════════════════════════════
-- MODULE: requests — update_requests, request_comments, internal_notes,
--         request_ratings
-- internal_notes lives here (not core) because it FKs update_requests; it is
-- a separate table specifically so agency-only RLS is trivial.
-- ═════════════════════════════════════════════════════════════════════════

create type public.request_priority as enum ('low','normal','urgent');
create type public.request_status as enum (
  'new','in_review','in_progress','awaiting_client','preview_ready','done','declined'
);

create table public.update_requests (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  title text not null,
  description text,
  page_url text,
  priority public.request_priority not null default 'normal',
  status public.request_status not null default 'new',
  preview_url text,
  assigned_to uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create index update_requests_client_idx on public.update_requests(client_id, created_at desc);
create index update_requests_status_idx on public.update_requests(status);

create table public.request_comments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.update_requests(id) on delete cascade,
  author_id uuid references auth.users(id) on delete set null,
  body text not null,
  attachment_paths text[] not null default '{}',
  created_at timestamptz not null default now()
);
create index request_comments_request_idx on public.request_comments(request_id, created_at);

create table public.internal_notes (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  request_id uuid references public.update_requests(id) on delete cascade,
  author_id uuid references auth.users(id) on delete set null,
  body text not null,
  created_at timestamptz not null default now()
);
create index internal_notes_client_idx on public.internal_notes(client_id, created_at desc);

create table public.request_ratings (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique references public.update_requests(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  score integer not null check (score between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);
create index request_ratings_client_idx on public.request_ratings(client_id);

-- ── RLS ────────────────────────────────────────────────────────────────────
alter table public.update_requests enable row level security;

create policy update_requests_agency_all on public.update_requests
  for all using (public.is_agency()) with check (public.is_agency());

create policy update_requests_client_read on public.update_requests
  for select using (client_id = public.current_client_id());

create policy update_requests_client_insert on public.update_requests
  for insert with check (
    client_id = public.current_client_id()
    and created_by = auth.uid()
  );

alter table public.request_comments enable row level security;

create policy request_comments_agency_all on public.request_comments
  for all using (public.is_agency()) with check (public.is_agency());

create policy request_comments_client_read on public.request_comments
  for select using (
    exists (
      select 1 from public.update_requests r
      where r.id = request_id and r.client_id = public.current_client_id()
    )
  );

create policy request_comments_client_insert on public.request_comments
  for insert with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.update_requests r
      where r.id = request_id and r.client_id = public.current_client_id()
    )
  );

-- internal_notes: agency-only, clients get no policies at all
alter table public.internal_notes enable row level security;

create policy internal_notes_agency_all on public.internal_notes
  for all using (public.is_agency()) with check (public.is_agency());

alter table public.request_ratings enable row level security;

create policy request_ratings_agency_all on public.request_ratings
  for all using (public.is_agency()) with check (public.is_agency());

create policy request_ratings_client_read on public.request_ratings
  for select using (client_id = public.current_client_id());

create policy request_ratings_client_insert on public.request_ratings
  for insert with check (
    client_id = public.current_client_id()
    and exists (
      select 1 from public.update_requests r
      where r.id = request_id and r.client_id = public.current_client_id()
    )
  );
