/**
 * Dockerless local RLS verification.
 *
 * Spins the REAL migrations up against a plain local Postgres (via the
 * Supabase compatibility shim), seeds minimal multi-tenant data, then runs an
 * allowed/denied matrix by switching to the anon/authenticated roles and
 * setting request.jwt.claims — exactly how PostgREST invokes our policies.
 *
 * Point LOCAL_PG_URL at a running local Postgres superuser connection.
 * This complements test:rls (which needs a hosted Supabase project); it proves
 * the policies themselves are correct without any cloud dependency.
 */
import { randomUUID } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const NAMESPACE_ORDER = [
  "core",
  "onboarding",
  "requests",
  "messages",
  "billing",
  "marketing",
  "documents",
  "website",
] as const;

const here = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(here, "..", "migrations");
const shimPath = join(here, "local-supabase-shim.sql");

const BASE = process.env.LOCAL_PG_URL ?? "postgres://postgres@127.0.0.1:55432/postgres";
const TESTDB = "ajh_rls_test";
const testUrl = BASE.replace(/\/[^/]*$/, `/${TESTDB}`);

const ids = {
  agency: randomUUID(),
  blush: randomUUID(),
  willow: randomUUID(),
  blushOwner: randomUUID(),
  willowOwner: randomUUID(),
};

interface Result {
  name: string;
  ok: boolean;
  detail?: string;
}
const results: Result[] = [];
function record(name: string, ok: boolean, detail?: string) {
  results.push({ name, ok, detail });
  console.log(`  ${ok ? "✓" : "✗"} ${name}${!ok && detail ? ` — ${detail}` : ""}`);
}

type Actor = { pgRole: "authenticated" | "anon"; sub: string | null };
const AGENCY: Actor = { pgRole: "authenticated", sub: ids.agency };
const CLIENT_A: Actor = { pgRole: "authenticated", sub: ids.blushOwner };
const CLIENT_B: Actor = { pgRole: "authenticated", sub: ids.willowOwner };
const ANON: Actor = { pgRole: "anon", sub: null };

async function main() {
  // 1) (Re)create the test database from a superuser connection.
  const admin = postgres(BASE, { max: 1, prepare: false, ssl: false, onnotice: () => {} });
  await admin.unsafe(`drop database if exists ${TESTDB} with (force)`);
  await admin.unsafe(`create database ${TESTDB}`);
  await admin.end();

  const sql = postgres(testUrl, { max: 1, prepare: false, ssl: false, onnotice: () => {} });

  try {
    // 2) Shim, then the real migrations, in order.
    await sql.unsafe(readFileSync(shimPath, "utf8"));
    let applied = 0;
    for (const ns of NAMESPACE_ORDER) {
      const dir = join(migrationsDir, ns);
      if (!existsSync(dir)) continue;
      for (const file of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
        await sql.unsafe(readFileSync(join(dir, file), "utf8"));
        applied++;
      }
    }
    console.log(`Applied shim + ${applied} migration(s).\n`);

    // 3) Seed (as superuser → bypasses RLS). Order matters for FKs:
    //    agency user → clients → client-owner users → sample rows.
    await sql`insert into auth.users (id, email, raw_user_meta_data) values
      (${ids.agency}, 'harry@ajhwebsitemanagement.com',
       ${sql.json({ role: "agency_admin", full_name: "Harry Gilligan" })})`;

    await sql`insert into public.clients (id, name, slug, status, plan, marketing_plan, monthly_update_quota, website_url)
      values
      (${ids.blush}, 'Blush & Co Hair', 'blush-and-co-hair', 'active', 'standard', true, 4, 'https://blushandco.example'),
      (${ids.willow}, 'Willow Therapy', 'willow-therapy', 'onboarding', 'starter', false, 2, null)`;

    await sql`insert into auth.users (id, email, raw_user_meta_data) values
      (${ids.blushOwner}, 'owner@blushandco.example',
       ${sql.json({ role: "client_owner", client_id: ids.blush, full_name: "Sophie Bailey" })}),
      (${ids.willowOwner}, 'owner@willowtherapy.example',
       ${sql.json({ role: "client_owner", client_id: ids.willow, full_name: "Megan Willow" })})`;

    // Requests
    const reqBlush = randomUUID();
    const reqWillow = randomUUID();
    await sql`insert into public.update_requests (id, client_id, created_by, title, status) values
      (${reqBlush}, ${ids.blush}, ${ids.blushOwner}, 'Blush request', 'new'),
      (${randomUUID()}, ${ids.blush}, ${ids.blushOwner}, 'Blush request 2', 'in_progress'),
      (${reqWillow}, ${ids.willow}, ${ids.willowOwner}, 'Willow request', 'new')`;

    await sql`insert into public.messages (client_id, sender_id, body) values
      (${ids.blush}, ${ids.blushOwner}, 'Blush hello'),
      (${ids.willow}, ${ids.willowOwner}, 'Willow hello')`;
    await sql`insert into public.internal_notes (client_id, author_id, body) values
      (${ids.blush}, ${ids.agency}, 'agency-only note')`;
    await sql`insert into public.documents (client_id, kind, title, storage_path, status) values
      (${ids.blush}, 'contract', 'Contract', 'blush/contract.pdf', 'accepted')`;
    await sql`insert into public.invoices (client_id, stripe_invoice_id, amount_pennies, status) values
      (${ids.blush}, 'in_test_1', 9900, 'paid')`;
    await sql`insert into public.ad_spend (client_id, month, platform, spend_pennies) values
      (${ids.blush}, '2026-06-01', 'meta', 15000)`;
    await sql`insert into public.access_grants (client_id, provider, method, status) values
      (${ids.blush}, 'domain', 'delegate', 'granted')`;
    await sql`insert into public.onboarding_responses (client_id, data, completed_at) values
      (${ids.blush}, ${sql.json({ business_name: "Blush & Co Hair" })}, now())`;
    await sql`insert into public.uptime_checks (client_id, ok, status_code, response_ms) values
      (${ids.blush}, true, 200, 180)`;
    await sql`insert into public.email_log (client_id, template, to_email) values
      (${ids.blush}, 'welcome_portal_invite', 'owner@blushandco.example')`;
    await sql`insert into public.scheduled_emails (client_id, template, send_at) values
      (${ids.willow}, 'access_request_nudge', now())`;
    await sql`insert into public.activity_log (client_id, actor_id, verb) values
      (${ids.blush}, ${ids.agency}, 'client.created')`;

    // Confirm the profile trigger fired for all three users.
    const profiles = await sql`select role from public.profiles`;
    record("profile trigger created 3 profiles", profiles.length === 3, `got ${profiles.length}`);

    // 4) Matrix helper.
    async function as<T>(actor: Actor, fn: (tx: postgres.TransactionSql) => Promise<T>): Promise<{ rows: T | null; error: string | null }> {
      try {
        const rows = await sql.begin(async (tx) => {
          await tx.unsafe(`set local role ${actor.pgRole}`);
          const claims = actor.sub
            ? JSON.stringify({ sub: actor.sub, role: "authenticated" })
            : "";
          await tx.unsafe(`set local request.jwt.claims = '${claims}'`);
          return await fn(tx as unknown as postgres.TransactionSql);
        });
        return { rows: rows as T, error: null };
      } catch (e) {
        return { rows: null, error: e instanceof Error ? e.message : String(e) };
      }
    }
    const count = (r: { rows: { n: number }[] | null }) => (r.rows && r.rows[0] ? Number(r.rows[0].n) : -1);

    // ── anon ────────────────────────────────────────────────────────────────
    console.log("\nanon:");
    record("anon sees 0 clients", count(await as(ANON, (t) => t`select count(*)::int n from clients`)) === 0);
    record("anon sees 0 requests", count(await as(ANON, (t) => t`select count(*)::int n from update_requests`)) === 0);
    record(
      "anon cannot insert a message",
      (await as(ANON, (t) => t`insert into messages (client_id, body) values (${ids.blush}, 'x')`)).error !== null,
    );

    // ── agency ────────────────────────────────────────────────────────────────
    console.log("\nagency:");
    record("agency sees both clients", count(await as(AGENCY, (t) => t`select count(*)::int n from clients`)) === 2);
    record("agency sees all 3 requests", count(await as(AGENCY, (t) => t`select count(*)::int n from update_requests`)) === 3);
    record("agency sees internal_notes", count(await as(AGENCY, (t) => t`select count(*)::int n from internal_notes`)) >= 1);
    record("agency sees email_log", count(await as(AGENCY, (t) => t`select count(*)::int n from email_log`)) >= 1);
    record("agency sees scheduled_emails", count(await as(AGENCY, (t) => t`select count(*)::int n from scheduled_emails`)) >= 1);
    record("agency sees activity_log", count(await as(AGENCY, (t) => t`select count(*)::int n from activity_log`)) >= 1);
    record(
      "agency can read agency-internal client columns",
      (await as(AGENCY, (t) => t`select stripe_customer_id, hosting_notes from clients limit 1`)).error === null,
    );
    {
      const r = await as(AGENCY, (t) => t`update clients set hosting_notes = 'x' where id = ${ids.blush} returning id`);
      record("agency can update a client", r.error === null && Array.isArray(r.rows) && (r.rows as unknown[]).length === 1, r.error ?? undefined);
    }
    record(
      "agency can write an internal note",
      (await as(AGENCY, (t) => t`insert into internal_notes (client_id, author_id, body) values (${ids.blush}, ${ids.agency}, 'x')`)).error === null,
    );

    // ── client A (blush) ───────────────────────────────────────────────────────
    console.log("\nclient A (blush owner):");
    record("client cannot read the base clients table (0 rows)", count(await as(CLIENT_A, (t) => t`select count(*)::int n from clients`)) === 0);
    record("client reads exactly 1 row from client_self", count(await as(CLIENT_A, (t) => t`select count(*)::int n from client_self`)) === 1);
    record(
      "client_self does not expose agency-internal columns",
      (await as(CLIENT_A, (t) => t`select stripe_customer_id from client_self`)).error !== null,
    );
    {
      const r = await as(CLIENT_A, (t) => t`update clients set name = 'Hacked' where id = ${ids.blush} returning id`);
      const affected = Array.isArray(r.rows) ? (r.rows as unknown[]).length : 0;
      record("client cannot update their client row (0 rows)", r.error !== null || affected === 0, r.error ?? `${affected} rows`);
    }
    record(
      "client cannot insert a client",
      (await as(CLIENT_A, (t) => t`insert into clients (name, slug) values ('x', 'x-rls')`)).error !== null,
    );
    {
      const r = await as(CLIENT_A, (t) => t`select id from profiles`);
      const rows = (r.rows as { id: string }[] | null) ?? [];
      const leaked = rows.some((p) => p.id === ids.agency);
      record("client cannot see agency profiles", !leaked && rows.length >= 1, leaked ? "agency profile leaked" : undefined);
    }
    {
      const r = await as(CLIENT_A, (t) => t`update profiles set full_name = 'Sophie B' where id = ${ids.blushOwner} returning id`);
      record("client can update own full_name", r.error === null && Array.isArray(r.rows) && (r.rows as unknown[]).length === 1, r.error ?? undefined);
    }
    record(
      "client cannot change own role (privilege denied)",
      (await as(CLIENT_A, (t) => t`update profiles set role = 'agency_admin' where id = ${ids.blushOwner}`)).error !== null,
    );
    {
      const after = await sql`select role from public.profiles where id = ${ids.blushOwner}`;
      record("role unchanged after escalation attempt", after[0]?.role === "client_owner");
    }
    record(
      "client sees only own requests",
      count(await as(CLIENT_A, (t) => t`select count(*)::int n from update_requests where client_id <> ${ids.blush}`)) === 0,
    );
    record(
      "client can create own request",
      (await as(CLIENT_A, (t) => t`insert into update_requests (client_id, created_by, title) values (${ids.blush}, ${ids.blushOwner}, 'ok')`)).error === null,
    );
    record(
      "client cannot create request for other tenant",
      (await as(CLIENT_A, (t) => t`insert into update_requests (client_id, created_by, title) values (${ids.willow}, ${ids.blushOwner}, 'x')`)).error !== null,
    );
    record(
      "client cannot forge created_by",
      (await as(CLIENT_A, (t) => t`insert into update_requests (client_id, created_by, title) values (${ids.blush}, ${ids.agency}, 'x')`)).error !== null,
    );
    record(
      "client can comment on own request",
      (await as(CLIENT_A, (t) => t`insert into request_comments (request_id, author_id, body) values (${reqBlush}, ${ids.blushOwner}, 'hi')`)).error === null,
    );
    record(
      "client cannot comment on other tenant's request",
      (await as(CLIENT_A, (t) => t`insert into request_comments (request_id, author_id, body) values (${reqWillow}, ${ids.blushOwner}, 'x')`)).error !== null,
    );
    record("client sees 0 internal_notes", count(await as(CLIENT_A, (t) => t`select count(*)::int n from internal_notes`)) === 0);
    record(
      "client cannot write internal_notes",
      (await as(CLIENT_A, (t) => t`insert into internal_notes (client_id, body) values (${ids.blush}, 'x')`)).error !== null,
    );
    record(
      "client sees only own messages",
      count(await as(CLIENT_A, (t) => t`select count(*)::int n from messages where client_id <> ${ids.blush}`)) === 0,
    );
    record(
      "client can send message in own thread",
      (await as(CLIENT_A, (t) => t`insert into messages (client_id, sender_id, body) values (${ids.blush}, ${ids.blushOwner}, 'hi')`)).error === null,
    );
    record(
      "client cannot message other tenant",
      (await as(CLIENT_A, (t) => t`insert into messages (client_id, sender_id, body) values (${ids.willow}, ${ids.blushOwner}, 'x')`)).error !== null,
    );
    record(
      "client cannot forge message sender",
      (await as(CLIENT_A, (t) => t`insert into messages (client_id, sender_id, body) values (${ids.blush}, ${ids.agency}, 'x')`)).error !== null,
    );
    record("client reads own invoices", count(await as(CLIENT_A, (t) => t`select count(*)::int n from invoices`)) >= 1);
    record(
      "client cannot insert invoices",
      (await as(CLIENT_A, (t) => t`insert into invoices (client_id, stripe_invoice_id, amount_pennies, status) values (${ids.blush}, 'x', 1, 'open')`)).error !== null,
    );
    record("client reads own ad_spend", count(await as(CLIENT_A, (t) => t`select count(*)::int n from ad_spend`)) >= 1);
    record(
      "client cannot write ad_spend",
      (await as(CLIENT_A, (t) => t`insert into ad_spend (client_id, month, platform) values (${ids.blush}, '2030-01-01', 'meta')`)).error !== null,
    );
    record("client reads own documents", count(await as(CLIENT_A, (t) => t`select count(*)::int n from documents`)) >= 1);
    record("client reads own access_grants", count(await as(CLIENT_A, (t) => t`select count(*)::int n from access_grants`)) >= 1);
    record("client reads own onboarding_responses", count(await as(CLIENT_A, (t) => t`select count(*)::int n from onboarding_responses`)) >= 1);
    record("client reads own uptime_checks", count(await as(CLIENT_A, (t) => t`select count(*)::int n from uptime_checks`)) >= 1);
    record("client sees 0 email_log", count(await as(CLIENT_A, (t) => t`select count(*)::int n from email_log`)) === 0);
    record("client sees 0 scheduled_emails", count(await as(CLIENT_A, (t) => t`select count(*)::int n from scheduled_emails`)) === 0);
    record("client sees 0 activity_log", count(await as(CLIENT_A, (t) => t`select count(*)::int n from activity_log`)) === 0);

    // ── client B (willow) cross-tenant isolation ──────────────────────────────
    console.log("\nclient B (willow owner):");
    record(
      "client B sees only willow requests",
      count(await as(CLIENT_B, (t) => t`select count(*)::int n from update_requests where client_id <> ${ids.willow}`)) === 0,
    );
    record(
      "client B reads only their own row via client_self",
      count(await as(CLIENT_B, (t) => t`select count(*)::int n from client_self where id = ${ids.willow}`)) === 1 &&
        count(await as(CLIENT_B, (t) => t`select count(*)::int n from client_self where id <> ${ids.willow}`)) === 0,
    );
    record("client B sees none of blush's documents", count(await as(CLIENT_B, (t) => t`select count(*)::int n from documents where client_id = ${ids.blush}`)) === 0);
    record("client B sees none of blush's messages", count(await as(CLIENT_B, (t) => t`select count(*)::int n from messages where client_id = ${ids.blush}`)) === 0);
  } finally {
    await sql.end();
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} RLS assertions passed`);
  if (failed.length > 0) {
    console.log("\nFAILED:");
    for (const f of failed) console.log(`  ✗ ${f.name}${f.detail ? ` — ${f.detail}` : ""}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
