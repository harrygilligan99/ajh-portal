# Requests module (`requests`)

Client-facing update requests with screenshots, a status timeline, comment threads and a monthly quota meter. Preview approval flow (approve / request changes) with a 1–5 rating on completion. Agency side: a cross-client kanban with drag-to-change-status, staff assignment and an internal notes panel.

**Status:** manifest + placeholder UI (full build in Phase 2).

## Config options (`module.config.ts → configSchema`)

- `defaultPriority` (low|normal|urgent, default normal) — preselected priority on the new-request form.

## Tables owned (`packages/db/migrations/requests/`)

- `update_requests`
- `request_comments`
- `internal_notes`
- `request_ratings`

All tables have RLS: agency roles get full access; client users are limited to rows where `client_id = current_client_id()` (see each migration for exact per-table read/write rules).

## Navigation

- Client: Requests → `/m/requests`
- Agency: Requests board → `/admin/m/requests`
