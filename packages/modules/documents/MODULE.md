# Documents module (`documents`)

Document vault listing the client's contract, welcome pack, monthly reports and other files with status badges (draft/sent/viewed/accepted) and signed Storage download links.

**Status:** manifest + placeholder UI (full build in Phase 3).

## Config options (`module.config.ts → configSchema`)

- No per-tenant options yet.

## Tables owned (`packages/db/migrations/documents/`)

- `documents`

All tables have RLS: agency roles get full access; client users are limited to rows where `client_id = current_client_id()` (see each migration for exact per-table read/write rules).

## Navigation

- Client: Documents → `/m/documents`
- Agency: none (lives inside the client detail tabs)
