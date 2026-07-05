# AJH Client Portal

Multi-tenant client portal + agency console for AJH Website Management, built as a
pilot of our composable module architecture.

- **Client portal** — each client business signs in (magic links) and sees only its own data.
- **Agency console** (`/admin`) — AJH staff manage every client.
- **Modules** — every feature is a self-contained package under `packages/modules/*`
  with a manifest, its own migrations and docs. The app shell renders nav/routes only
  for a client's `enabled_modules`. `registry.json` is the generated catalogue.

## Stack

Turborepo + pnpm · Next.js (App Router, TS strict) · Tailwind + shadcn-style UI ·
Supabase (Postgres, Auth, Storage, RLS everywhere) · Resend + React Email ·
Stripe (hosted invoices/portal, Phase 5) · Vercel (+ Cron).

## Monorepo layout

```
apps/portal            Next.js app shell — composes modules, owns nothing feature-specific
packages/ui            shared presentational components
packages/db            schema, namespaced migrations, types, seed + RLS tests
packages/config        zod schemas for tenant + module config, module manifest contract
packages/email         React Email templates (brandable via props)
packages/modules/*     onboarding · requests · messages · billing · marketing · documents · website
registry.json          generated module catalogue (pnpm registry)
```

Each module exports route components + server actions + `module.config.ts`
(slug, name, description, version, zod configSchema, client/agency navItems) and
documents itself in `MODULE.md`. Its tables live in `packages/db/migrations/<module>/`.

## Getting started

### 1. Prerequisites

- Node 20+, pnpm 10 (`npm i -g pnpm`)
- A Supabase project (free tier is fine)
- A Resend account (for emails), Stripe comes in Phase 5

### 2. Environment

```bash
cp .env.example .env
```

Fill in from the Supabase dashboard (Project Settings → API and → Database):

| Var | Where it comes from |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | same page — **server-side only, never exposed** |
| `SUPABASE_DB_URL` | Project Settings → Database → Connection string (URI). Direct (5432) or pooler both work |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` locally, your Vercel URL in prod |
| `RESEND_API_KEY` / `EMAIL_FROM` | Resend dashboard (see email setup below) |
| `SEED_USER_PASSWORD` | anything — used only by the seed + RLS tests |

The single root `.env` feeds Next.js **and** all db scripts (loaded by `next.config.mjs` / the scripts).

### 3. Supabase auth settings (dashboard)

1. **Authentication → Sign In / Up**: disable "Allow new users to sign up"
   (accounts are invite-only; the login form also refuses to create users).
2. **Authentication → URL Configuration**: set Site URL to your app URL and add
   `http://localhost:3000/**` to the redirect allow-list.

### 4. Database

```bash
pnpm install
pnpm db:migrate     # applies packages/db/migrations (core + each module) in order
pnpm db:seed        # 3 agency staff + Blush & Co Hair demo data + a 2nd client for RLS tests
pnpm test:rls       # allowed/denied matrix as agency, two clients and anon — must pass
```

**RLS is the contract: `pnpm test:rls` must be green before building UI on any table.**

### Verifying RLS without a hosted Supabase project

If you don't have a Supabase project yet, you can still prove the policies are
correct against a plain local Postgres (no Docker, no cloud):

```bash
# with any local Postgres 14+ running, as a superuser connection:
LOCAL_PG_URL=postgres://postgres@127.0.0.1:5432/postgres \
  pnpm --filter @ajh/db test:rls:local
```

This applies a Supabase compatibility shim (`packages/db/scripts/local-supabase-shim.sql`
— recreates the anon/authenticated/service_role roles, the `auth` schema and
`auth.uid()`/`auth.role()` reading `request.jwt.claims`), runs the **real
migrations**, seeds two tenants and asserts an allowed/denied matrix by
switching roles exactly as PostgREST does. It creates/drops a throwaway
`ajh_rls_test` database. As of the last run: **46/46 assertions pass on
Postgres 16.2.**

Seeded logins (password = `SEED_USER_PASSWORD`, magic links work too):
`harry@ajhwebsitemanagement.com` (agency_admin), `alexander@…`, `jamie@…` (agency_member),
`owner@blushandco.example`, `owner@willowtherapy.example` (client owners).

### 5. Run it

```bash
pnpm dev            # turbo → next dev on :3000
```

Sign in as Harry → agency console; as the Blush owner → client portal.

Other scripts: `pnpm build` · `pnpm typecheck` · `pnpm registry` (regenerate registry.json).

## Email (Resend) setup

1. Resend → Domains → add `ajhwebsitemanagement.com`.
2. Add the DNS records Resend shows at your DNS host (Namecheap):
   - **SPF** — TXT on the sending subdomain Resend gives you (e.g. `send`):
     `v=spf1 include:amazonses.com ~all`
   - **DKIM** — the three CNAME (or TXT) records shown in the dashboard
   - optional but recommended: **DMARC** TXT `_dmarc` → `v=DMARC1; p=none;`
3. Wait for "Verified", then set `RESEND_API_KEY` and `EMAIL_FROM` (must be on the
   verified domain).
4. **Route Supabase's own auth emails through Resend too** (so magic-link logins match
   our domain): Supabase → Project Settings → Auth → SMTP settings → enable custom
   SMTP with host `smtp.resend.com`, port 465, username `resend`, password = your
   Resend API key, sender = `EMAIL_FROM`.

Invite emails (owner + teammate invites) are sent by us through Resend with the
branded `welcome_portal_invite` template and logged to `email_log`.

## Stripe (Phase 5 — not wired yet)

Keys are already in `.env.example`. When Phase 5 lands: create a webhook endpoint for
`invoice.finalized`, `invoice.paid`, `invoice.payment_failed`,
`checkout.session.completed`; locally use
`stripe listen --forward-to localhost:3000/api/webhooks/stripe` and put the printed
signing secret in `STRIPE_WEBHOOK_SECRET`. Disable Stripe's own invoice emails
(Settings → Emails) — the portal sends its own.

## Deploy (Vercel)

1. Push the repo to GitHub and import it in Vercel (AJH team).
2. Framework: Next.js. **Root Directory: `apps/portal`** — Vercel detects the
   Turborepo/pnpm workspace automatically.
3. Add all env vars from `.env` (`SUPABASE_SERVICE_ROLE_KEY` etc. as server-side vars).
4. Set `NEXT_PUBLIC_APP_URL` to the production URL and add it to the Supabase
   auth redirect allow-list.
5. Cron jobs (dispatcher / uptime / monthly) arrive with Phases 4–6 via `vercel.json`.

## Development rules

- TypeScript strict; zod validation on every server action.
- Service-role key server-side only (`server-only` guards the import).
- RLS + passing `pnpm test:rls` **before** UI for any table.
- No custom billing UI — Stripe-hosted invoices and portal only.
- Never store passwords for client accounts/providers anywhere (access_grants tracks
  invite/delegate/transfer status instead).
- Ambiguity → make the pragmatic call and log it in `DECISIONS.md`.
