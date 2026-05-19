# Authentication & authorization (Better Auth)

## Choice

**[Better Auth](https://www.better-auth.com/)** handles authentication, sessions, and (via plugin) **organizations** for multi-tenant B2B.

Goals:

- Email/password or magic link for MVP (decide with pilot — email/password is simplest for desk staff)
- Session cookies for Next.js App Router
- Organization = freight forwarder company
- Users can belong to one org in MVP (multi-org membership later)

## Planned setup

| Piece | Approach |
|-------|----------|
| Server config | `lib/auth/auth.ts` — `betterAuth({ ... })` |
| Route handler | `app/api/auth/[...all]/route.ts` |
| Client | `lib/auth/auth-client.ts` for sign-in UI |
| Database adapter | Drizzle adapter pointing at same Neon Postgres |
| Organizations | Better Auth **organization plugin** |
| Session in RSC | `auth.api.getSession({ headers })` in server components / actions |

## Organization model

```
User ──< Member >── Organization
                      └── all business data (organization_id)
```

On first sign-up / invite flow:

1. Create Better Auth organization (or accept invite).
2. Ensure app `organizations` row exists (same id or mapped).
3. Set **active organization** in session or cookie for subsequent requests.

MVP: user belongs to **exactly one** organization — skip org switcher UI.

## Roles (application)

Store on `organization_members.role`:

| Role | Description |
|------|-------------|
| `owner` | Full access, billing later |
| `admin` | Manage users, all data |
| `operator` | Dossiers + documents |
| `accountant` | Ledger + exports |

Enforce in module services:

```ts
// Conceptual
function assertRole(session, allowed: Role[]) { ... }
```

Do not rely on UI hiding alone.

## Authorization rules

Every service method:

1. Resolve session — reject if missing.
2. Resolve `organizationId` from session — reject if missing.
3. Pass `organizationId` into all queries.
4. Check role for destructive actions (reversals, member admin).

## What Better Auth does *not* do

- Dossier/customer/ledger authorization → **application layer**
- Document access → verify dossier belongs to org before presigning R2 URL
- Row Level Security in Postgres → optional later; not required for MVP

## Routes

| Route | Access |
|-------|--------|
| `/login`, `/signup` | Public |
| `/invite/[token]` | Public (if using invites) |
| `/dashboard`, `/declarations`, `/clients`, `/dossiers/[id]`, … | Authenticated |
| `/api/auth/*` | Better Auth handler |

Middleware: protect `(app)` route group — redirect unauthenticated users to `/login`.

## Environment

```bash
BETTER_AUTH_SECRET=    # openssl rand -base64 32
BETTER_AUTH_URL=http://localhost:3000
DATABASE_URL=          # same DB as app (auth tables + app tables)
```

## Implementation checklist

- [ ] Install `better-auth` + Drizzle adapter
- [ ] Generate auth schema / migrate
- [ ] Enable organization plugin
- [ ] Sign up → create org flow for first user
- [ ] Invite second user (operator) for demo
- [ ] Session helper: `getSessionOrRedirect()`, `requireOrg()`
- [ ] Wire seed users with known passwords (dev only)

## References

- [Better Auth docs](https://www.better-auth.com/docs)
- [Organization plugin](https://www.better-auth.com/docs/plugins/organization)
- [Next.js integration](https://www.better-auth.com/docs/integrations/next)

Update this doc with exact table names once the adapter schema is generated.
