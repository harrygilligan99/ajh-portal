/**
 * Seed script — creates agency staff, the demo client "Blush & Co Hair" with
 * realistic sample data, and a second client ("Willow Therapy") used by the
 * RLS test matrix for cross-tenant assertions.
 *
 * Idempotent: users are created-or-updated, demo data is wiped and re-inserted.
 * Requires: SUPABASE_DB migrations applied first (pnpm db:migrate).
 */
import { createServiceClient, type TypedSupabaseClient } from "../src/index";
import { loadEnv, requireEnv } from "./env";
import { SEED_USERS } from "./seed-users";

loadEnv();

const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
const serviceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
const password = requireEnv("SEED_USER_PASSWORD");

const db: TypedSupabaseClient = createServiceClient(url, serviceKey);

function fail(label: string, message: string): never {
  console.error(`✗ ${label}: ${message}`);
  process.exit(1);
}

function check<T>(res: { data: T; error: { message: string } | null }, label: string): T {
  if (res.error) fail(label, res.error.message);
  return res.data;
}

function firstOfMonthISO(monthsBack: number): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthsBack, 1))
    .toISOString()
    .slice(0, 10);
}

function daysFromNow(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString();
}

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

async function findUserIdByEmail(email: string): Promise<string | null> {
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
    if (error) fail("listUsers", error.message);
    const match = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (match) return match.id;
    if (data.users.length < 200) break;
  }
  return null;
}

async function ensureUser(
  email: string,
  fullName: string,
  role: "agency_admin" | "agency_member" | "client_owner" | "client_member",
  clientId: string | null,
): Promise<string> {
  const metadata = { full_name: fullName, role, client_id: clientId ?? "" };
  const { data, error } = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: metadata,
  });

  let userId: string;
  if (error) {
    const existing = await findUserIdByEmail(email);
    if (!existing) fail(`createUser ${email}`, error.message);
    userId = existing!;
    const upd = await db.auth.admin.updateUserById(userId, {
      password,
      user_metadata: metadata,
    });
    if (upd.error) fail(`updateUser ${email}`, upd.error.message);
  } else {
    userId = data.user.id;
  }

  // Trigger creates the profile on first insert; upsert makes reruns converge.
  check(
    await db.from("profiles").upsert({ id: userId, full_name: fullName, role, client_id: clientId }),
    `profile upsert ${email}`,
  );
  return userId;
}

async function upsertClient(row: {
  name: string;
  slug: string;
  status: "lead" | "onboarding" | "active" | "paused" | "archived";
  plan: "starter" | "standard" | "pro";
  marketing_plan: boolean;
  enabled_modules: string[];
  monthly_update_quota: number;
  website_url?: string;
  domain_registrar?: string;
  domain_renewal_date?: string;
  hosting_notes?: string;
}): Promise<string> {
  const res = await db
    .from("clients")
    .upsert({ ...row }, { onConflict: "slug" })
    .select("id")
    .single();
  const data = check(res, `client upsert ${row.slug}`);
  if (!data) fail(`client upsert ${row.slug}`, "no row returned");
  return data.id;
}

async function wipeClientData(clientIds: string[]): Promise<void> {
  // update_requests cascades comments/ratings/request-scoped internal notes
  const tables = [
    "internal_notes",
    "update_requests",
    "messages",
    "ad_spend",
    "invoices",
    "onboarding_responses",
    "access_grants",
    "documents",
    "uptime_checks",
    "activity_log",
    "scheduled_emails",
    "email_log",
  ] as const;
  for (const table of tables) {
    const res = await db.from(table).delete().in("client_id", clientIds);
    if (res.error) fail(`wipe ${table}`, res.error.message);
  }
}

async function main(): Promise<void> {
  console.log("Seeding clients ...");
  const blushId = await upsertClient({
    name: "Blush & Co Hair",
    slug: "blush-and-co-hair",
    status: "active",
    plan: "standard",
    marketing_plan: true,
    enabled_modules: ["onboarding", "requests", "messages", "billing", "marketing", "documents", "website"],
    monthly_update_quota: 4,
    website_url: "https://blushandco.example",
    domain_registrar: "Namecheap",
    domain_renewal_date: firstOfMonthISO(-8),
    hosting_notes: "Vercel, AJH team. DNS at Namecheap.",
  });
  const willowId = await upsertClient({
    name: "Willow Therapy",
    slug: "willow-therapy",
    status: "onboarding",
    plan: "starter",
    marketing_plan: false,
    enabled_modules: ["onboarding", "requests", "messages", "documents"],
    monthly_update_quota: 2,
  });

  console.log("Seeding users ...");
  const harryId = await ensureUser(SEED_USERS.harry.email, SEED_USERS.harry.fullName, "agency_admin", null);
  const alexanderId = await ensureUser(SEED_USERS.alexander.email, SEED_USERS.alexander.fullName, "agency_member", null);
  await ensureUser(SEED_USERS.jamie.email, SEED_USERS.jamie.fullName, "agency_member", null);
  const blushOwnerId = await ensureUser(SEED_USERS.blushOwner.email, SEED_USERS.blushOwner.fullName, "client_owner", blushId);
  const willowOwnerId = await ensureUser(SEED_USERS.willowOwner.email, SEED_USERS.willowOwner.fullName, "client_owner", willowId);

  console.log("Wiping previous demo data ...");
  await wipeClientData([blushId, willowId]);

  console.log("Seeding Blush & Co Hair demo data ...");

  const requests = check(
    await db
      .from("update_requests")
      .insert([
        { client_id: blushId, created_by: blushOwnerId, title: "Update opening hours for summer", description: "We're open until 8pm on Thursdays from July.", page_url: "https://blushandco.example/contact", priority: "normal", status: "new", created_at: daysAgo(1) },
        { client_id: blushId, created_by: blushOwnerId, title: "New staff member photo + bio", description: "Add Chloe to the team page — photo attached.", page_url: "https://blushandco.example/team", priority: "low", status: "in_review", assigned_to: alexanderId, created_at: daysAgo(3) },
        { client_id: blushId, created_by: blushOwnerId, title: "Price list refresh", description: "New colour services pricing for autumn.", page_url: "https://blushandco.example/prices", priority: "urgent", status: "in_progress", assigned_to: harryId, created_at: daysAgo(5) },
        { client_id: blushId, created_by: blushOwnerId, title: "Homepage hero photo swap", description: "Use the new salon interior shots.", page_url: "https://blushandco.example", priority: "normal", status: "preview_ready", preview_url: "https://preview.blushandco.example", assigned_to: harryId, created_at: daysAgo(9) },
        { client_id: blushId, created_by: blushOwnerId, title: "Add gift voucher page", description: "Sell vouchers online for Mother's Day.", priority: "normal", status: "done", assigned_to: alexanderId, created_at: daysAgo(30), completed_at: daysAgo(21) },
        { client_id: blushId, created_by: blushOwnerId, title: "Add a blog section", description: "Weekly hair care tips.", priority: "low", status: "declined", created_at: daysAgo(40) },
      ])
      .select("id, status, title"),
    "insert update_requests",
  );
  if (!requests) fail("insert update_requests", "no rows returned");

  const inProgress = requests.find((r) => r.status === "in_progress")!;
  const done = requests.find((r) => r.status === "done")!;

  check(
    await db.from("request_comments").insert([
      { request_id: inProgress.id, author_id: blushOwnerId, body: "The autumn price list is attached — colour correction has changed the most.", attachment_paths: ["blush-and-co-hair/uploads/price-list-autumn.pdf"], created_at: daysAgo(4) },
      { request_id: inProgress.id, author_id: harryId, body: "Got it — I'll have a draft on the preview link by Friday.", created_at: daysAgo(4) },
    ]),
    "insert request_comments",
  );

  check(
    await db.from("internal_notes").insert([
      { client_id: blushId, request_id: inProgress.id, author_id: harryId, body: "Sophie wants this live before their September promo — prioritise over the hero swap." },
      { client_id: blushId, author_id: alexanderId, body: "Renewal call booked for next month. Upsell: marketing report walkthrough." },
    ]),
    "insert internal_notes",
  );

  check(
    await db.from("request_ratings").insert([
      { request_id: done.id, client_id: blushId, score: 5, comment: "Voucher page looks brilliant, thank you!" },
    ]),
    "insert request_ratings",
  );

  check(
    await db.from("messages").insert([
      { client_id: blushId, sender_id: blushOwnerId, body: "Hi both — loving the new site so far!", created_at: daysAgo(12), read_at: daysAgo(12) },
      { client_id: blushId, sender_id: harryId, body: "Thanks Sophie! Shout if anything needs tweaking.", created_at: daysAgo(12), read_at: daysAgo(11) },
      { client_id: blushId, sender_id: blushOwnerId, body: "Could we talk about Google reviews next week?", created_at: daysAgo(2), read_at: daysAgo(1) },
      { client_id: blushId, sender_id: harryId, body: "Absolutely — Tuesday afternoon work?", created_at: daysAgo(1) },
      { client_id: blushId, sender_id: blushOwnerId, body: "Tuesday is perfect.", created_at: daysAgo(0.5) },
    ]),
    "insert messages",
  );

  const months = [firstOfMonthISO(3), firstOfMonthISO(2), firstOfMonthISO(1)];
  check(
    await db.from("ad_spend").insert([
      { client_id: blushId, month: months[0]!, platform: "meta", spend_pennies: 15000, clicks: 420, impressions: 21000, leads: 9 },
      { client_id: blushId, month: months[0]!, platform: "google", spend_pennies: 10000, clicks: 180, impressions: 8000, leads: 6 },
      { client_id: blushId, month: months[1]!, platform: "meta", spend_pennies: 18000, clicks: 510, impressions: 26500, leads: 12 },
      { client_id: blushId, month: months[1]!, platform: "google", spend_pennies: 12000, clicks: 210, impressions: 9400, leads: 7 },
      { client_id: blushId, month: months[2]!, platform: "meta", spend_pennies: 18000, clicks: 565, impressions: 28800, leads: 15 },
      { client_id: blushId, month: months[2]!, platform: "google", spend_pennies: 14000, clicks: 260, impressions: 11000, leads: 9 },
    ]),
    "insert ad_spend",
  );

  check(
    await db.from("invoices").insert([
      { client_id: blushId, stripe_invoice_id: "in_seed_blush_001", amount_pennies: 9900, status: "paid", hosted_invoice_url: "https://invoice.stripe.com/i/seed_blush_001", pdf_url: "https://invoice.stripe.com/i/seed_blush_001/pdf", issued_at: daysAgo(35) },
      { client_id: blushId, stripe_invoice_id: "in_seed_blush_002", amount_pennies: 9900, status: "open", hosted_invoice_url: "https://invoice.stripe.com/i/seed_blush_002", pdf_url: "https://invoice.stripe.com/i/seed_blush_002/pdf", issued_at: daysAgo(4) },
    ]),
    "insert invoices",
  );

  check(
    await db.from("onboarding_responses").insert([
      {
        client_id: blushId,
        data: {
          business_name: "Blush & Co Hair",
          address: "12 King Street, Huddersfield HD1 2QT",
          phone: "01484 000000",
          instagram: "@blushandcohair",
          goals: "More colour bookings, sell vouchers online",
          brand_words: "warm, premium, friendly",
        },
        completed_at: daysAgo(60),
        created_at: daysAgo(62),
      },
    ]),
    "insert onboarding_responses",
  );

  check(
    await db.from("access_grants").insert([
      { client_id: blushId, provider: "domain", account_identifier: "sophie@blushandco.example (Namecheap)", method: "delegate", status: "granted", notes: "Delegate access accepted 1st week." },
      { client_id: blushId, provider: "meta", account_identifier: "Blush & Co Hair FB page", method: "invite", status: "pending_client", notes: "Partner request sent from AJH Business Manager." },
      { client_id: blushId, provider: "google_analytics", account_identifier: "sophie@blushandco.example", method: "invite", status: "requested" },
    ]),
    "insert access_grants",
  );

  check(
    await db.from("documents").insert([
      { client_id: blushId, kind: "contract", title: "AJH Service Agreement — Blush & Co Hair", storage_path: "blush-and-co-hair/contract.pdf", status: "accepted", accepted_at: daysAgo(58), accepted_by: blushOwnerId, accepted_name_typed: "Sophie Bailey", created_at: daysAgo(60) },
      { client_id: blushId, kind: "welcome_pack", title: "Welcome Pack — Blush & Co Hair", storage_path: "blush-and-co-hair/welcome-pack.pdf", status: "sent", created_at: daysAgo(60) },
      { client_id: blushId, kind: "report", title: `Monthly report — ${months[2]!.slice(0, 7)}`, storage_path: `blush-and-co-hair/reports/${months[2]!.slice(0, 7)}.pdf`, status: "sent", created_at: daysAgo(3) },
    ]),
    "insert documents",
  );

  check(
    await db.from("uptime_checks").insert([
      { client_id: blushId, ok: true, status_code: 200, response_ms: 187, checked_at: daysAgo(1) },
      { client_id: blushId, ok: true, status_code: 200, response_ms: 203, checked_at: daysAgo(0.04) },
    ]),
    "insert uptime_checks",
  );

  check(
    await db.from("email_log").insert([
      { client_id: blushId, template: "welcome_portal_invite", to_email: SEED_USERS.blushOwner.email, resend_id: "seed-resend-001", status: "sent", sent_at: daysAgo(60) },
    ]),
    "insert email_log",
  );

  check(
    await db.from("scheduled_emails").insert([
      { client_id: willowId, template: "access_request_nudge", payload: { reason: "seed" }, send_at: daysFromNow(3) },
    ]),
    "insert scheduled_emails",
  );

  check(
    await db.from("activity_log").insert([
      { client_id: blushId, actor_id: blushOwnerId, verb: "request.created", subject_type: "update_request", subject_id: inProgress.id, created_at: daysAgo(5) },
      { client_id: blushId, actor_id: harryId, verb: "request.status_changed", subject_type: "update_request", subject_id: inProgress.id, created_at: daysAgo(4) },
    ]),
    "insert activity_log",
  );

  console.log("Seeding Willow Therapy demo data ...");
  check(
    await db.from("update_requests").insert([
      { client_id: willowId, created_by: willowOwnerId, title: "Add FAQs page", description: "Common questions from new clients.", priority: "normal", status: "new" },
    ]),
    "insert willow request",
  );
  check(
    await db.from("messages").insert([
      { client_id: willowId, sender_id: willowOwnerId, body: "Looking forward to getting started!" },
    ]),
    "insert willow message",
  );
  check(
    await db.from("invoices").insert([
      { client_id: willowId, stripe_invoice_id: "in_seed_willow_001", amount_pennies: 4900, status: "open", issued_at: daysAgo(2) },
    ]),
    "insert willow invoice",
  );

  console.log("");
  console.log("Seed complete. Login emails (password = SEED_USER_PASSWORD, magic links also work):");
  for (const u of Object.values(SEED_USERS)) console.log(`  - ${u.email} (${u.role})`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
