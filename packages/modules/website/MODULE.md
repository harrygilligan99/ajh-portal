# Website module (`website`)

A website card showing the live URL, latest uptime ping result and response time, domain registrar + renewal date and hosting notes. Uptime is captured by a daily Vercel Cron ping stored in uptime_checks.

**Status:** manifest + placeholder UI (full build in Phase 6).

## Config options (`module.config.ts → configSchema`)

- `pingPath` (string, default `/`) — path appended to website_url for the daily uptime ping.

## Tables owned (`packages/db/migrations/website/`)

- `uptime_checks`

All tables have RLS: agency roles get full access; client users are limited to rows where `client_id = current_client_id()` (see each migration for exact per-table read/write rules).

## Navigation

- Client: Website → `/m/website`
- Agency: none (lives inside the client detail tabs)
