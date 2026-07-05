import { config } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Single .env at the monorepo root feeds Next, the migration runner and the
// seed/RLS scripts alike.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
config({ path: path.join(root, ".env.local") });
config({ path: path.join(root, ".env") });

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@ajh/ui",
    "@ajh/config",
    "@ajh/db",
    "@ajh/email",
    "@ajh/module-onboarding",
    "@ajh/module-requests",
    "@ajh/module-messages",
    "@ajh/module-billing",
    "@ajh/module-marketing",
    "@ajh/module-documents",
    "@ajh/module-website",
  ],
};

export default nextConfig;
