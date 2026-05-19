# Technology stack

## Summary

| Layer | Choice | Notes |
|-------|--------|-------|
| Runtime / package manager | **Bun** | Already used in repo |
| Framework | **Next.js** (App Router) | UI + server boundaries |
| Language | **TypeScript** (strict) | End-to-end |
| Styling | **Tailwind CSS v4** + **shadcn/ui** (Base UI) | Vercel tokens in `globals.css`; see `DESIGN.md` |
| Theming | **next-themes** | Class on `<html>`; Clair / Sombre / Système in user menu; toggle on `/login` |
| Database | **PostgreSQL 17** locally; **Neon** for staging/production | Same schema via Drizzle migrations |
| ORM / migrations | **Drizzle** | Typed SQL, migrations in repo |
| Validation | **Zod** | API boundaries, forms, shared schemas |
| Auth | **[Better Auth](https://www.better-auth.com/)** | Sessions, orgs, RBAC — see [07-auth.md](./07-auth.md) |
| Object storage | **Cloudflare R2** | Documents; presigned uploads |
| Background jobs | **Vercel Cron** or **Inngest** first | OCR/email later |
| Hosting | **Vercel** (app) + **Neon** (hosted DB) + **R2** (files) |
| Errors | **Sentry** (later) | Add when staging exists |

## Explicitly not using (for now)

| Option | Reason |
|--------|--------|
| Supabase as backend/ORM | Couples product to their client model; we own Postgres |
| Prisma | Fine alternative; Drizzle chosen for reporting/SQL escape hatch |
| Microservices | Monolith modular until proven otherwise |
| Event sourcing / Kafka | Append-only `activity_log` is enough |
| Trigger.dev (day 1) | Add when async OCR/email ingest is real |

## Repository layout (target)

Start as a single Next app; extract packages when duplication hurts.

```
ndouckmane-transit/
├── app/                    # Next.js routes, layouts, UI
├── lib/
│   ├── auth/               # Better Auth config + helpers
│   ├── db/                 # Drizzle client, schema, migrations
│   └── modules/            # Application services by domain
│       ├── customers/
│       ├── dossiers/
│       ├── declarations/
│       ├── ledger/
│       ├── documents/
│       └── activity/
├── components/             # Shared UI (shadcn)
├── docs/                   # This folder
└── drizzle/                # SQL migrations (or drizzle/ in lib/db)
```

Optional later:

```
packages/
  domain/     # FSM, money rules — zero framework imports
  shared/     # Zod schemas shared client ↔ server
```

## Database environments

| Environment | Postgres | Connection |
|-------------|----------|------------|
| **Local dev** | PostgreSQL **17** on your machine (Homebrew, Docker, or native) | `DATABASE_URL` in `.env.local` |
| **Staging / production** | **Neon** serverless Postgres | `DATABASE_URL` in Vercel env |

Use the **same Drizzle migrations** for all environments. No Neon-specific SQL in migrations unless documented.

### Local setup (PostgreSQL 17)

```bash
# Example: Homebrew macOS
brew install postgresql@17
brew services start postgresql@17
createdb ndouckmane_transit_dev

# .env.local
DATABASE_URL=postgresql://localhost:5432/ndouckmane_transit_dev
```

Optional: `docker compose` with `postgres:17` — add `compose.yml` when implementing platform tasks.

### Commands

```bash
bun run db:generate   # drizzle-kit generate
bun run db:migrate    # apply migrations
bun run db:seed       # dev seed data
bun run db:studio     # drizzle-kit studio (optional)
bun run dev           # Next.js dev server
bun run build         # production build
```

## Environment variables (planned)

```bash
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database — local Postgres 17 in dev; Neon URL in staging/prod
DATABASE_URL=postgresql://localhost:5432/ndouckmane_transit_dev

# Better Auth
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000

# R2 (S3-compatible) — optional in early dev; mock/skip uploads until wired
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=
```

## Money handling

- Store amounts as **integers** in minor units (XOF: whole francs).
- Never use floating point for money.
- All ledger lines are **insert-only**; corrections use **reversal** entries.

## Time zones

- Persist `timestamptz` in **UTC**.
- Display in **`Africa/Dakar`** in UI and PDFs.
