/**
 * RLS test matrix — signs in as a seeded agency user, two different client
 * owners and an anonymous visitor, then asserts what each may and may not do.
 * Run AFTER `pnpm db:migrate && pnpm db:seed`. Exits non-zero on any failure.
 */
import { createClient } from "@supabase/supabase-js";
import { createServiceClient } from "../src/index";
import type { Database } from "../src/types";
import { loadEnv, requireEnv } from "./env";
import { SEED_USERS } from "./seed-users";

loadEnv();

const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
const anonKey = requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
const serviceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
const password = requireEnv("SEED_USER_PASSWORD");

const service = createServiceClient(url, serviceKey);

type PgRes = { data: unknown; error: { message: string } | null };

const results: { name: string; ok: boolean; detail?: string }[] = [];

function record(name: string, ok: boolean, detail?: string): void {
  results.push({ name, ok, detail });
  console.log(`${ok ? "  ✓" : "  ✗"} ${name}${!ok && detail ? ` — ${detail}` : ""}`);
}

function rows(res: PgRes): unknown[] {
  return Array.isArray(res.data) ? res.data : [];
}

function expectOk(name: string, res: PgRes): void {
  record(name, !res.error, res.error?.message);
}

function expectDenied(name: string, res: PgRes): void {
  record(name, !!res.error, "expected an RLS/privilege error but the write succeeded");
}

/** Updates/deletes without a policy fail silently: 0 rows affected. */
function expectNoEffect(name: string, res: PgRes): void {
  record(name, !!res.error || rows(res).length === 0, "rows were affected");
}

function expectEmpty(name: string, res: PgRes): void {
  record(
    name,
    !res.error && rows(res).length === 0,
    res.error?.message ?? `expected 0 rows, got ${rows(res).length}`,
  );
}

function expectRows(name: string, res: PgRes, predicate: (r: unknown[]) => boolean, detail: string): void {
  record(name, !res.error && predicate(rows(res)), res.error?.message ?? detail);
}

async function signIn(email: string) {
  const client = createClient<Database>(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) {
    console.error(`Could not sign in as ${email}: ${error.message}. Did you run pnpm db:seed?`);
    process.exit(1);
  }
  return client;
}

async function main(): Promise<void> {
  // ── Reference data via service role ──────────────────────────────────────
  const blush = (await service.from("clients").select("id").eq("slug", "blush-and-co-hair").single()).data;
  const willow = (await service.from("clients").select("id").eq("slug", "willow-therapy").single()).data;
  if (!blush || !willow) {
    console.error("Seed data not found. Run pnpm db:migrate && pnpm db:seed first.");
    process.exit(1);
  }
  const blushId = blush.id;
  const willowId = willow.id;

  const blushRequests = (await service.from("update_requests").select("id,status").eq("client_id", blushId)).data ?? [];
  const declinedRequest = blushRequests.find((r) => r.status === "declined");
  const anyBlushRequest = blushRequests[0];
  const willowRequest = (await service.from("update_requests").select("id").eq("client_id", willowId).limit(1).single()).data;
  const harryProfile = (await service.from("profiles").select("id").eq("role", "agency_admin").limit(1).single()).data;
  if (!declinedRequest || !anyBlushRequest || !willowRequest || !harryProfile) {
    console.error("Expected seeded requests/profiles are missing. Re-run pnpm db:seed.");
    process.exit(1);
  }

  const agency = await signIn(SEED_USERS.harry.email);
  const clientA = await signIn(SEED_USERS.blushOwner.email); // Blush & Co
  const clientB = await signIn(SEED_USERS.willowOwner.email); // Willow
  const anon = createClient<Database>(url, anonKey, { auth: { persistSession: false } });

  const clientAUser = (await clientA.auth.getUser()).data.user!;

  // ── Anonymous ─────────────────────────────────────────────────────────────
  console.log("\nanon:");
  expectEmpty("anon sees no clients", await anon.from("clients").select("id"));
  expectEmpty("anon sees no requests", await anon.from("update_requests").select("id"));
  expectDenied("anon cannot insert a message", await anon.from("messages").insert({ client_id: blushId, body: "RLS-TEST anon" }));

  // ── Agency user ───────────────────────────────────────────────────────────
  console.log("\nagency (harry):");
  expectRows("agency sees all clients", await agency.from("clients").select("id"), (r) => r.length >= 2, "expected ≥2 clients");
  expectRows("agency sees requests across clients", await agency.from("update_requests").select("id,client_id"), (r) => {
    const ids = new Set((r as { client_id: string }[]).map((x) => x.client_id));
    return ids.has(blushId) && ids.has(willowId);
  }, "expected requests for both clients");
  expectRows("agency sees internal notes", await agency.from("internal_notes").select("id"), (r) => r.length >= 2, "expected ≥2 notes");
  expectRows("agency sees email_log", await agency.from("email_log").select("id"), (r) => r.length >= 1, "expected ≥1 row");
  expectRows("agency sees scheduled_emails", await agency.from("scheduled_emails").select("id"), (r) => r.length >= 1, "expected ≥1 row");
  expectRows("agency sees activity_log", await agency.from("activity_log").select("id"), (r) => r.length >= 2, "expected ≥2 rows");
  expectRows(
    "agency can update a client",
    await agency.from("clients").update({ hosting_notes: "Vercel, AJH team. DNS at Namecheap." }).eq("id", blushId).select("id"),
    (r) => r.length === 1,
    "expected 1 row updated",
  );
  expectOk(
    "agency can write an internal note",
    await agency.from("internal_notes").insert({ client_id: blushId, author_id: harryProfile.id, body: "RLS-TEST agency note" }),
  );

  // ── Client A (Blush & Co owner) ──────────────────────────────────────────
  console.log("\nclient A (blush owner):");
  expectRows(
    "client sees exactly their own client row",
    await clientA.from("clients").select("id"),
    (r) => r.length === 1 && (r as { id: string }[])[0]!.id === blushId,
    "expected only the blush row",
  );
  expectNoEffect(
    "client cannot update their client row",
    await clientA.from("clients").update({ name: "Hacked Salon" }).eq("id", blushId).select("id"),
  );
  expectDenied("client cannot insert a client", await clientA.from("clients").insert({ name: "RLS-TEST", slug: "rls-test-client" }));

  expectRows(
    "client profile visibility is same-client only",
    await clientA.from("profiles").select("id,client_id"),
    (r) => r.length >= 1 && (r as { id: string; client_id: string | null }[]).every(
      (p) => p.client_id === blushId || p.id === clientAUser.id,
    ) && !(r as { id: string }[]).some((p) => p.id === harryProfile.id),
    "saw a profile outside their client (or agency staff)",
  );
  expectRows(
    "client can update their own full_name",
    await clientA.from("profiles").update({ full_name: "Sophie Bailey" }).eq("id", clientAUser.id).select("id"),
    (r) => r.length === 1,
    "expected 1 row updated",
  );
  expectDenied(
    "client cannot change their own role",
    await clientA.from("profiles").update({ role: "agency_admin" }).eq("id", clientAUser.id),
  );
  const roleAfter = (await service.from("profiles").select("role").eq("id", clientAUser.id).single()).data;
  record("role unchanged after escalation attempt", roleAfter?.role === "client_owner");

  expectRows(
    "client sees only their own requests",
    await clientA.from("update_requests").select("id,client_id"),
    (r) => r.length >= 6 && (r as { client_id: string }[]).every((x) => x.client_id === blushId),
    "expected ≥6 rows, all blush",
  );
  expectOk(
    "client can create a request for themselves",
    await clientA.from("update_requests").insert({ client_id: blushId, created_by: clientAUser.id, title: "RLS-TEST own request" }),
  );
  expectDenied(
    "client cannot create a request for another client",
    await clientA.from("update_requests").insert({ client_id: willowId, created_by: clientAUser.id, title: "RLS-TEST cross-tenant" }),
  );
  expectDenied(
    "client cannot forge created_by",
    await clientA.from("update_requests").insert({ client_id: blushId, created_by: harryProfile.id, title: "RLS-TEST forged author" }),
  );

  expectOk(
    "client can comment on their own request",
    await clientA.from("request_comments").insert({ request_id: anyBlushRequest.id, author_id: clientAUser.id, body: "RLS-TEST comment" }),
  );
  expectDenied(
    "client cannot comment on another client's request",
    await clientA.from("request_comments").insert({ request_id: willowRequest.id, author_id: clientAUser.id, body: "RLS-TEST cross comment" }),
  );

  expectEmpty("client sees no internal notes", await clientA.from("internal_notes").select("id"));
  expectDenied(
    "client cannot write internal notes",
    await clientA.from("internal_notes").insert({ client_id: blushId, body: "RLS-TEST sneaky note" }),
  );

  expectOk(
    "client can rate their own request",
    await clientA.from("request_ratings").insert({ request_id: declinedRequest.id, client_id: blushId, score: 4, comment: "RLS-TEST" }),
  );
  expectDenied(
    "client cannot rate another client's request",
    await clientA.from("request_ratings").insert({ request_id: willowRequest.id, client_id: willowId, score: 1, comment: "RLS-TEST" }),
  );

  expectRows(
    "client sees only their own messages",
    await clientA.from("messages").select("client_id"),
    (r) => r.length >= 5 && (r as { client_id: string }[]).every((x) => x.client_id === blushId),
    "expected ≥5 rows, all blush",
  );
  expectOk(
    "client can send a message in their thread",
    await clientA.from("messages").insert({ client_id: blushId, sender_id: clientAUser.id, body: "RLS-TEST message" }),
  );
  expectDenied(
    "client cannot message another client's thread",
    await clientA.from("messages").insert({ client_id: willowId, sender_id: clientAUser.id, body: "RLS-TEST cross" }),
  );
  expectDenied(
    "client cannot forge message sender",
    await clientA.from("messages").insert({ client_id: blushId, sender_id: harryProfile.id, body: "RLS-TEST forged" }),
  );

  expectRows("client reads own invoices", await clientA.from("invoices").select("client_id"), (r) => r.length >= 2, "expected ≥2");
  expectDenied(
    "client cannot insert invoices",
    await clientA.from("invoices").insert({ client_id: blushId, stripe_invoice_id: "in_rls_test", amount_pennies: 1, status: "open" }),
  );

  expectRows("client reads own ad_spend", await clientA.from("ad_spend").select("client_id"), (r) => r.length >= 6, "expected ≥6");
  expectDenied(
    "client cannot write ad_spend",
    await clientA.from("ad_spend").insert({ client_id: blushId, month: "2030-01-01", platform: "meta" }),
  );

  expectRows("client reads own documents", await clientA.from("documents").select("client_id"), (r) => r.length >= 3, "expected ≥3");
  expectRows("client reads own uptime checks", await clientA.from("uptime_checks").select("client_id"), (r) => r.length >= 2, "expected ≥2");
  expectRows("client reads own access grants", await clientA.from("access_grants").select("client_id"), (r) => r.length >= 3, "expected ≥3");
  expectRows("client reads own onboarding responses", await clientA.from("onboarding_responses").select("client_id"), (r) => r.length >= 1, "expected ≥1");

  expectEmpty("client sees no email_log", await clientA.from("email_log").select("id"));
  expectEmpty("client sees no scheduled_emails", await clientA.from("scheduled_emails").select("id"));
  expectEmpty("client sees no activity_log", await clientA.from("activity_log").select("id"));
  expectDenied(
    "client cannot write email_log",
    await clientA.from("email_log").insert({ template: "welcome_portal_invite", to_email: "x@example.com" }),
  );

  // ── Client B (Willow owner) — cross-tenant isolation ─────────────────────
  console.log("\nclient B (willow owner):");
  expectRows(
    "client B sees only willow requests",
    await clientB.from("update_requests").select("client_id"),
    (r) => r.length >= 1 && (r as { client_id: string }[]).every((x) => x.client_id === willowId),
    "saw rows from another tenant",
  );
  expectRows(
    "client B cannot see blush's client row",
    await clientB.from("clients").select("id"),
    (r) => (r as { id: string }[]).every((x) => x.id === willowId),
    "saw another tenant's client row",
  );
  expectEmpty("client B sees none of blush's documents", await clientB.from("documents").select("id").eq("client_id", blushId));
  expectEmpty("client B sees none of blush's messages", await clientB.from("messages").select("id").eq("client_id", blushId));

  // ── Cleanup test artefacts ────────────────────────────────────────────────
  await service.from("request_ratings").delete().eq("comment", "RLS-TEST");
  await service.from("request_comments").delete().like("body", "RLS-TEST%");
  await service.from("messages").delete().like("body", "RLS-TEST%");
  await service.from("internal_notes").delete().like("body", "RLS-TEST%");
  await service.from("update_requests").delete().like("title", "RLS-TEST%");

  // ── Summary ───────────────────────────────────────────────────────────────
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} RLS assertions passed`);
  if (failed.length > 0) {
    console.log("\nFailed assertions:");
    for (const f of failed) console.log(`  ✗ ${f.name}${f.detail ? ` — ${f.detail}` : ""}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
