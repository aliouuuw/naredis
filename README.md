This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Project docs

- **Planning:** [`docs/`](./docs/README.md) — domain model, stack, UX, auth
- **Tracking:** [`backlog.json`](./backlog.json) — tasks · [`progress.md`](./progress.md) — status & decisions

**Local dev database:** PostgreSQL **17** (see [docs/02-stack.md](./docs/02-stack.md)). Neon for staging/production later.

## Database setup

1. Copy env: `cp .env.local.example .env.local`
2. Create DB (Homebrew example): `createdb ndouckmane_transit_dev`
3. Apply schema: `bun run db:migrate`
4. Load demo data + dev admin: `bun run db:seed`
5. To refresh demo data after schema/product changes: `bun run db:reseed`
6. Log in at `/login` with `admin@demo-transit.sn` / `DemoAdmin2026!` (override via `SEED_ADMIN_*` in `.env.local`)

Or use Docker: `docker compose up -d` (Postgres 17 on port 5432).

| Command | Purpose |
|---------|---------|
| `bun run db:generate` | Generate migration from schema changes |
| `bun run db:migrate` | Apply migrations |
| `bun run db:seed` | Dev seed (org `demo-transit`, pilot-shaped data) |
| `bun run db:reseed` | Wipe `demo-transit` org and seed again |
| `bun run db:studio` | Drizzle Studio |

## Getting Started

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel + Neon

1. Connect the repo to Vercel and add Neon (Storage integration or manual env vars).
2. Set `DATABASE_URL` (pooled), `DATABASE_URL_UNPOOLED` (direct), `BETTER_AUTH_*`, `NEXT_PUBLIC_APP_URL` — see [docs/04-deploy-vercel-neon.md](./docs/04-deploy-vercel-neon.md).
3. Deploy — migrations run automatically via `vercel-build` (`db:migrate:deploy` then `next build`).
4. **Once** after first deploy, seed the preview DB from your machine: `ALLOW_DEV_SEED=true bun run db:seed:preview` (with preview env vars loaded).

Full checklist: [docs/04-deploy-vercel-neon.md](./docs/04-deploy-vercel-neon.md).
