/**
 * Apply pending Drizzle migrations (local, CI, or Vercel build).
 * Uses DATABASE_URL_UNPOOLED when set (recommended for Neon).
 */
import { config } from "dotenv";
import { spawnSync } from "node:child_process";
import { getMigrationDatabaseUrl } from "../lib/db/migration-url";

config({ path: ".env.local" });
config({ path: ".env" });

const url = getMigrationDatabaseUrl();
const host = (() => {
  try {
    return new URL(url).host;
  } catch {
    return "(invalid URL)";
  }
})();

console.log(`Applying migrations → ${host}`);

const result = spawnSync("bunx", ["drizzle-kit", "migrate"], {
  stdio: "inherit",
  env: process.env,
});

process.exit(result.status ?? 1);
