import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";
import { loadEnv, requireEnv } from "./env";

/**
 * Applies namespaced SQL migrations from packages/db/migrations/<namespace>/.
 * Namespaces run in a fixed order (core first — everything FKs to clients/profiles);
 * files inside a namespace run in filename order. Applied files are recorded in
 * public._migrations (RLS enabled, no policies → invisible to app users).
 */
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

loadEnv();
const dbUrl = requireEnv("SUPABASE_DB_URL");
const isLocal = /localhost|127\.0\.0\.1/.test(dbUrl);
const sql = postgres(dbUrl, {
  max: 1,
  prepare: false,
  ssl: isLocal ? false : "require",
  onnotice: () => {},
});

const migrationsDir = join(dirname(fileURLToPath(import.meta.url)), "..", "migrations");

async function main(): Promise<void> {
  await sql`create table if not exists public._migrations (
    id text primary key,
    applied_at timestamptz not null default now()
  )`;
  await sql`alter table public._migrations enable row level security`;

  const appliedRows = await sql`select id from public._migrations`;
  const applied = new Set(appliedRows.map((r) => r.id as string));

  let count = 0;
  for (const ns of NAMESPACE_ORDER) {
    const dir = join(migrationsDir, ns);
    if (!existsSync(dir)) continue;
    const files = readdirSync(dir)
      .filter((f) => f.endsWith(".sql"))
      .sort();
    for (const file of files) {
      const id = `${ns}/${file}`;
      if (applied.has(id)) continue;
      const content = readFileSync(join(dir, file), "utf8");
      console.log(`Applying ${id} ...`);
      await sql.begin(async (tx) => {
        await tx.unsafe(content);
        await tx`insert into public._migrations (id) values (${id})`;
      });
      count += 1;
    }
  }
  console.log(count > 0 ? `Applied ${count} migration(s).` : "Nothing to apply — up to date.");
}

main()
  .then(() => sql.end())
  .catch(async (err) => {
    console.error(err);
    await sql.end();
    process.exit(1);
  });
