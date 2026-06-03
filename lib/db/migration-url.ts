/**
 * Connection URL for Drizzle migrations (CLI / Vercel build).
 * Prefer Neon's direct (non-pooled) URL so advisory locks work.
 */
export function getMigrationDatabaseUrl(): string {
  const url =
    process.env.DATABASE_URL_UNPOOLED ??
    process.env.POSTGRES_URL_NON_POOLING ??
    process.env.DATABASE_URL;

  if (!url) {
    throw new Error(
      "No database URL for migrations. Set DATABASE_URL_UNPOOLED (recommended on Neon) or DATABASE_URL.",
    );
  }

  return url;
}
