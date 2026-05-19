# Authentication & authorization (Better Auth)

## Choice

**[Better Auth](https://www.better-auth.com/)** handles **sessions** and **email/password login**.  
**Tenancy** (which cabinet the user belongs to) lives in app tables, not the Better Auth organization plugin.

## Current setup (MVP dev)

| Piece | Location |
|-------|----------|
| Server config | `lib/auth/auth.ts` |
| API handler | `app/api/auth/[...all]/route.ts` |
| Client | `lib/auth/auth-client.ts` |
| Session helpers | `lib/auth/session.ts` |
| Dev admin seed | `lib/auth/seed-dev-admin.ts` |
| Route guard (cookie) | `proxy.ts` |
| App org membership | `organizations` + `organization_members` (UUID) |

### Dev login (no public signup)

- `emailAndPassword.disableSignUp: true` — no self-service registration
- `bun run db:seed` creates demo data + admin user
- Default credentials (override with `SEED_ADMIN_*` in `.env.local`):

| Variable | Default |
|----------|---------|
| `SEED_ADMIN_EMAIL` | `admin@demo-transit.sn` |
| `SEED_ADMIN_PASSWORD` | `DemoAdmin2026!` |

Production: seed refuses to run unless `ALLOW_DEV_SEED=true`.

## Organization model

```
Better Auth user (text id)
  └── organization_members (app) ──► organizations (uuid)
                                        └── all business data (organization_id)
```

MVP: **one organization per user** — no org switcher.

Better Auth tables `organization` / `member` / `invitation` exist from an earlier plugin migration but are **unused** for tenancy today. Reconciliation or removal: **PLAT-009**.

## Roles (application)

Stored on `organization_members.role`:

| Role | Description |
|------|-------------|
| `owner` | Full access |
| `admin` | Manage users, all data |
| `operator` | Déclarations, documents |
| `accountant` | Ledger + exports |

Enforce in services via `requireRole()` — not UI-only.

## Authorization rules

Every server path that touches business data:

1. `requireAuthContext()` — session + `organizationId` from `organization_members`
2. Pass `organizationId` into every query
3. `requireRole([...])` for destructive actions

If the user has a session but no `organization_members` row, they are signed out and redirected to `/login?error=no_organization`.

## Routes

| Route | Access |
|-------|--------|
| `/login` | Public |
| `/declarations`, `/clients`, `/dossiers`, … | Authenticated + org member |
| `/api/auth/*` | Better Auth |

## Environment

```bash
BETTER_AUTH_SECRET=    # openssl rand -base64 32
BETTER_AUTH_URL=http://localhost:3000
DATABASE_URL=

# Dev seed only
SEED_ADMIN_EMAIL=admin@demo-transit.sn
SEED_ADMIN_PASSWORD=DemoAdmin2026!
# SEED_ADMIN_RESET_PASSWORD=true  # force password refresh on re-seed
# ALLOW_DEV_SEED=true            # required to seed in production
```

## Implementation checklist

- [x] Better Auth + Drizzle adapter
- [x] Auth schema migrated (`user`, `session`, `account`, …)
- [x] Public signup disabled; dev admin via seed
- [x] `requireAuthContext()` / `requireOrg()`
- [ ] Invite second user (operator) — PLAT-007
- [ ] Proxy full session validation — PLAT-010
- [ ] Reconcile unused BA org tables — PLAT-009

## References

- [Better Auth docs](https://www.better-auth.com/docs)
- [Next.js integration](https://www.better-auth.com/docs/integrations/next)
