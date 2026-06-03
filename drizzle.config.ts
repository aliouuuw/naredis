import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";
import { getMigrationDatabaseUrl } from "./lib/db/migration-url";

config({ path: ".env.local" });
config({ path: ".env" });

export default defineConfig({
  schema: "./lib/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: getMigrationDatabaseUrl(),
  },
});
