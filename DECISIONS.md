# DECISIONS

Pragmatic calls made where the brief was ambiguous. Newest at the bottom.

## Phase 0 — 2026-07-05

1. **Repo location.** The build session was opened in the `fitshare` repo, but this is a new product — scaffolded as a fresh repo at `Documents/GitHub/ajh-portal` instead. Intended GitHub home: `ajhwebsitemanagement/ajh-portal` (not pushed yet — awaiting Harry's confirmation of the name).
2. **Tailwind v3.4 + hand-vendored shadcn-style components** in `packages/ui` rather than the interactive shadcn CLI (non-interactive build, and the shared package needs to own the primitives anyway). Radix primitives will be added per-component when a component actually needs one (dialog, dropdown etc.).
3. **Migrations: custom runner, not Supabase CLI.** The brief wants module-namespaced migration folders (`packages/db/migrations/<module>/`), which the Supabase CLI's flat timestamp folder fights against. `pnpm db:migrate` applies namespaces in a fixed order (core first) and records progress in `public._migrations` (RLS-enabled, no policies → invisible to app roles). Works identically against hosted Supabase and local. The Supabase CLI can still be used later for `gen types`.
4. **Login emails vs invite emails.** Invites are fully ours: `auth.admin.generateLink` → token_hash URL → branded React Email via Resend, logged to `email_log`. Routine magic-link logins go through `signInWithOtp`, which uses Supabase's mailer — README documents pointing Supabase SMTP at Resend so *all* mail rides the verified Resend domain. One template system, no duplicate "you have been invited" from Supabase.
5. **Client-side RLS narrowed from the brief's blanket "SELECT/INSERT".** INSERT is only granted where a real client flow needs it (update_requests, request_comments, request_ratings, messages, onboarding_responses, access_grants). documents / invoices / ad_spend / uptime_checks / clients are **read-only** for clients; email_log / scheduled_emails / activity_log / internal_notes are agency-only. Status transitions (preview approval etc.) will go through validated server actions in Phase 2+.
6. **Second seed client ("Willow Therapy").** The RLS matrix needs a cross-tenant victim to prove isolation; the brief's single demo client can't test that.
7. **`internal_notes` lives in the requests module migrations** (it FKs `update_requests`); `activity_log`, `scheduled_emails`, `email_log` are core (cross-cutting infrastructure, not module-owned).
8. **Profiles are created by a DB trigger** on `auth.users` insert, reading role/client_id from invite metadata (set only by our server-side flows; public signups are off via `shouldCreateUser: false` + invite-only accounts). Unknown metadata degrades to `client_member` with no client — i.e. no access.
9. **Role changes are service-role only.** Column-level grants let authenticated users update only their own `full_name`; role/client_id edits happen through server actions using the service key. Blocks self-escalation even if a policy slips later.
10. **Module mounting for Phase 0** uses dynamic segments (`/m/[slug]`, `/admin/m/[slug]`) that render each module's exported `ClientRoot`/`AgencyRoot`. Later phases replace these placeholders with real route segments per module — the manifest/nav contract stays identical.
11. **Only `welcome_portal_invite` email template exists now** — the other nine land with the sequence engine in Phase 4 (per the build order).
12. **New clients start as `status: lead` with all 7 modules enabled** and DB-default quota 4; Phase 1's settings screen is where these get tuned. Slug collisions auto-suffix (`-2`, `-3`…).
13. **Login form is enumeration-safe**: unknown emails get the same "if that address has access…" message as known ones.
14. **`prepare: false` + single connection in the migration runner** so both the Supabase transaction pooler (6543) and direct (5432) connection strings work.
15. **Failed owner invites roll back** (delete auth user + client row) so a retry starts clean rather than leaving half-created clients.
