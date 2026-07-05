# Marketing module (`marketing`)

For clients on the marketing plan: monthly ad spend / clicks / impressions / leads charts (recharts), a month-over-month table and downloadable monthly reports. For everyone else: a pitch page with pricing and a Stripe Checkout join flow. Ad spend is entered manually by agency staff (no ads API connections in v1).

**Status:** manifest + placeholder UI (full build in Phase 5).

## Config options (`module.config.ts → configSchema`)

- `showLeadsChart` (bool, default true) — include the leads chart (hide for clients where leads aren't tracked).

## Tables owned (`packages/db/migrations/marketing/`)

- `ad_spend`

All tables have RLS: agency roles get full access; client users are limited to rows where `client_id = current_client_id()` (see each migration for exact per-table read/write rules).

## Navigation

- Client: Marketing → `/m/marketing`
- Agency: Ad spend → `/admin/m/marketing`
