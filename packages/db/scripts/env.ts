import { config } from "dotenv";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/** Load the monorepo root .env (and .env.local override) into process.env. */
export function loadEnv(): void {
  const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
  config({ path: join(root, ".env.local") });
  config({ path: join(root, ".env") });
}

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(
      `Missing required env var ${name}. Copy .env.example to .env at the repo root and fill it in.`,
    );
    process.exit(1);
  }
  return value;
}
