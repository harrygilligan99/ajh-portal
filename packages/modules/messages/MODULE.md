# Messages module (`messages`)

A single per-client thread between the client and the agency, with unread badges on both sides and email notification on new messages (respecting per-user notification preferences).

**Status:** manifest + placeholder UI (full build in Phase 6).

## Config options (`module.config.ts → configSchema`)

- `emailNotifications` (bool, default true) — send new_message emails for this client's thread.

## Tables owned (`packages/db/migrations/messages/`)

- `messages`

All tables have RLS: agency roles get full access; client users are limited to rows where `client_id = current_client_id()` (see each migration for exact per-table read/write rules).

## Navigation

- Client: Messages → `/m/messages`
- Agency: Messages → `/admin/m/messages`
