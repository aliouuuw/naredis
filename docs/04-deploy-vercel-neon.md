# Deploy — Vercel + Neon

Checklist for preview/production. Do **not** commit real connection strings.

## 1. Neon database

1. Create a Neon project (or use the Vercel Storage / Neon integration).
2. Note two connection strings from the Neon console:
   - **Pooled** — for the Next.js app at runtime (`?sslmode=require` is usually included).
   - **Direct / non-pooled** — for migrations (avoids pooler issues with Drizzle).

## 2. Vercel environment variables

Set these on the Vercel project (Preview + Production as needed):

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | **Pooled** Neon URL — used by the app (`lib/db`) |
| `DATABASE_URL_UNPOOLED` | **Direct** Neon URL — used at **build** for `db:migrate:deploy` |
| `BETTER_AUTH_SECRET` | Long random secret (e.g. `openssl rand -base64 32`) |
| `BETTER_AUTH_URL` | Canonical site URL, e.g. `https://your-app.vercel.app` |
| `NEXT_PUBLIC_APP_URL` | Same as `BETTER_AUTH_URL` |
| `SEED_ADMIN_EMAIL` | Only if you will run preview seed (step 4) |
| `SEED_ADMIN_PASSWORD` | Strong password for pilot login after seed |

If the Neon ↔ Vercel integration maps different names (e.g. `POSTGRES_URL`), copy the **pooled** value into `DATABASE_URL` and the **non-pooling** value into `DATABASE_URL_UNPOOLED`.

Optional (only for one-time demo seed on hosted DB):

| Variable | Value |
|----------|--------|
| `ALLOW_DEV_SEED` | `true` — only while running seed; remove after |

## 3. Migrations (automatic on deploy)

Each Vercel deployment runs:

```bash
bun run db:migrate:deploy   # via vercel-build in package.json
bun run build
```

So the hosted database schema stays in sync with `drizzle/*.sql` without a manual step.

**Verify locally against Neon** (pull env, do not commit):

```bash
vercel env pull .env.vercel.preview --environment=preview
# Copy DATABASE_URL_UNPOOLED + DATABASE_URL into your shell or a local file you gitignore
bun run db:migrate:deploy
```

## 4. Seed preview data (once per environment)

The dev seed (`demo-transit` org, pilot declarations, admin user) is **not** run on every deploy. Run it **once** after the first successful deploy (or when you need a fresh demo).

From your machine, with Preview env vars loaded and `ALLOW_DEV_SEED=true`:

```bash
# Example: after vercel env pull into .env.vercel.preview
export $(grep -v '^#' .env.vercel.preview | xargs)
export ALLOW_DEV_SEED=true
bun run db:seed:preview
```

Or reseed from scratch:

```bash
export ALLOW_DEV_SEED=true
bun run db:reseed:preview
```

Then log in with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` (defaults in `.env.local.example` if unset).

**Production:** do not seed demo data unless intentional; omit `ALLOW_DEV_SEED` on production.

## 5. Deploy

1. Push to the branch connected to Vercel.
2. Confirm the build log shows `Applying migrations → …` then a successful Next build.
3. Open the preview URL → `/login`.
4. If the DB is empty, run step 4 once.

## 6. Troubleshooting

| Issue | Fix |
|-------|-----|
| Migration fails at build | Set `DATABASE_URL_UNPOOLED` to Neon’s **direct** URL; redeploy. |
| App 500 / DB errors at runtime | Check `DATABASE_URL` is the **pooled** URL and includes SSL. |
| Auth redirect loops | `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` must match the live URL (no trailing slash). |
| “Refusing to run dev seed in production” | Expected on deploy; run `db:seed:preview` locally with `ALLOW_DEV_SEED=true`. |
| Login fails after seed | Confirm seed finished; use the same `SEED_ADMIN_*` vars you exported when seeding. |

## Commands reference

| Command | When |
|---------|------|
| `bun run db:migrate` | Local dev DB |
| `bun run db:migrate:deploy` | Neon / any hosted DB (prefers unpooled URL) |
| `bun run db:seed` | Local only (default guard) |
| `bun run db:seed:preview` | One-time hosted preview with `ALLOW_DEV_SEED=true` |
| `bun run db:reseed:preview` | Wipe `demo-transit` on hosted preview and reseed |
