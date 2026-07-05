# Billing module (`billing`)

Invoice list synced from Stripe webhooks with links to Stripe-hosted invoices/PDFs, a current plan card, Stripe customer portal access, and an upgrade CTA to Stripe Checkout for the marketing plan add-on. Agency side: create and send Stripe invoices from the console. No custom payment UI — Stripe hosts everything.

**Status:** manifest + placeholder UI (full build in Phase 5).

## Config options (`module.config.ts → configSchema`)

- `showUpgradeCta` (bool, default true) — show the marketing-plan upgrade card to this client.

## Tables owned (`packages/db/migrations/billing/`)

- `invoices`

All tables have RLS: agency roles get full access; client users are limited to rows where `client_id = current_client_id()` (see each migration for exact per-table read/write rules).

## Navigation

- Client: Billing → `/m/billing`
- Agency: none (lives inside the client detail tabs)
