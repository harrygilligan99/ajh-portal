# Onboarding module (`onboarding`)

Guided new-client setup wizard: business details, brand asset uploads, provider access grants (invite/delegate — never passwords) and a short questionnaire. On completion it generates the Welcome Pack and Contract PDFs from editable {{placeholder}} templates and records typed-name contract acceptance.

**Status:** manifest + placeholder UI (full build in Phase 3).

## Config options (`module.config.ts → configSchema`)

- `nudgeAfterDays` (int, default 3) — days to wait before the access_request_nudge email if grants are still pending_client.

## Tables owned (`packages/db/migrations/onboarding/`)

- `onboarding_responses`
- `access_grants`

All tables have RLS: agency roles get full access; client users are limited to rows where `client_id = current_client_id()` (see each migration for exact per-table read/write rules).

## Navigation

- Client: Onboarding → `/m/onboarding`
- Agency: none (lives inside the client detail tabs)
