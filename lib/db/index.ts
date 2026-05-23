import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  return url;
}

const globalForDb = globalThis as unknown as {
  queryClient: ReturnType<typeof postgres> | undefined;
};

function createQueryClient() {
  return postgres(getDatabaseUrl(), {
    max: 10,
    prepare: false,
  });
}

function getQueryClient() {
  if (!globalForDb.queryClient) {
    globalForDb.queryClient = createQueryClient();
  }
  return globalForDb.queryClient;
}

export function getDb() {
  return drizzle(getQueryClient(), { schema });
}

/** Close pooled connections so CLI scripts (seed, migrate helpers) can exit. */
export async function closeDb() {
  const client = globalForDb.queryClient;
  if (!client) {
    return;
  }
  await client.end({ timeout: 5 });
  globalForDb.queryClient = undefined;
}

export type Db = ReturnType<typeof getDb>;

/** Database or transaction — use in module services. */
export type DbLike = Db | Parameters<Parameters<Db["transaction"]>[0]>[0];
