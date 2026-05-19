# Progress — Ndouckmane Transit

Living status for the MVP. **Backlog:** [`backlog.json`](./backlog.json) (update `status` as work completes).

**Last updated:** 2026-05-19

---

## Current phase

**Platform foundation** — database and schema in place.

**Next up:** `DOM-001` (declaration FSM) or `UI-001` (auth pages polish)

---

## Snapshot

| Area | Status |
|------|--------|
| Next.js 16 scaffold | Done |
| Planning docs (`docs/`) | Done |
| `backlog.json` / `progress.md` | Done |
| Local PostgreSQL 17 | Done |
| Drizzle + schema | Done |
| Dev seed data | Done |
| Better Auth | Done |
| Tenancy helpers (`requireAuthContext`) | Done |
| shadcn + app shell (PLAT-008) | Done |
| UI / modules | Not started |

---

## Environment decisions

| Topic | Decision |
|-------|----------|
| **Local database** | PostgreSQL **17** (`ndouckmane_transit_dev`) |
| **Hosted database** | **Neon** for staging/production only (later: `POL-004`) |
| **ORM** | Drizzle + SQL migrations in repo |
| **Auth** | Better Auth + organization plugin |
| **Package manager** | Bun |
| **Domain model** | `dossiers` (jobs) + `declarations` (customs filings); UI **Déclarations** — [docs/00-glossary.md](./docs/00-glossary.md) |
| **Money** | Immutable ledger; solde computed; allocations at dossier level |

---

## MVP definition of done

From [docs/03-mvp-scope.md](./docs/03-mvp-scope.md):

- [ ] Pilot completes happy path in **déclaration** language
- [ ] Rectificative (second déclaration, same dossier) works
- [ ] Client solde matches ledger
- [ ] Invalid customs status transitions blocked
- [ ] Documents org-scoped
- [ ] Deployed staging (Neon + Vercel) when ready for external pilot

---

## Suggested implementation order

Matches backlog dependencies:

1. **Platform** — PLAT-001 … PLAT-008  
2. **Domain** — DOM-001 … DOM-007 (FSM + modules)  
3. **Shell** — UI-001, UI-002  
4. **Déclarations UI** — DECL-001 … DECL-005  
5. **Dossier hub** — DOS-001 … DOS-003  
6. **Clients & money** — CLI-001 … CLI-004  
7. **Polish** — POL-001 … POL-004  

---

## In progress

_None._

---

## Recently completed

| ID | Title | Date |
|----|-------|------|
| PLAT-001 | PostgreSQL 17 local dev + DATABASE_URL | 2026-05-19 |
| PLAT-002 | Drizzle ORM setup + migration scripts | 2026-05-19 |
| PLAT-003 | Core schema (orgs, customers, dossiers, declarations) | 2026-05-19 |
| PLAT-004 | Ledger, allocations, documents, activity_log | 2026-05-19 |
| PLAT-005 | Better Auth + organization plugin | 2026-05-19 |
| PLAT-006 | Tenancy helpers (requireAuthContext) | 2026-05-19 |
| PLAT-007 | Dev seed script | 2026-05-19 |
| PLAT-008 | shadcn/ui + app shell baseline | 2026-05-19 |
| UI-002   | App sidebar + Vercel design  | 2026-05-19 |
| — | Project planning docs | 2026-05-19 |
| — | Dossier vs déclaration glossary + doc refresh | 2026-05-19 |
| — | UX IA + flows | 2026-05-19 |
| — | backlog.json + progress.md | 2026-05-19 |

---

## Blockers

_None._

---

## Context log

Short decisions and notes for future sessions (newest first).

### 2026-05-19 — shadcn + app shell (PLAT-008)

Initialized shadcn (base-nova). App shell: collapsible sidebar (Déclarations, Clients, Réglages, Tableau de bord), header with search placeholder + user menu, CTA « Nouvelle déclaration ». Stub routes: `/dashboard`, `/settings`, `/declarations/new`.

Integrated Vercel's design system (`DESIGN.md`): reverted to Geist/Geist Mono, matched the `canvas-soft` and `ink` color palette in `globals.css`, fixed sidebar text wrap, and adopted pill-shaped CTAs.

### 2026-05-19 — Drizzle schema + seed

Implemented `lib/db/schema/*` with all MVP tables from [docs/06-data-model.md](./docs/06-data-model.md). Migrations in `drizzle/`. Dev seed: org `demo-transit`, 3 clients, 4 dossiers (incl. rectificative), ledger sample. Commands: `bun run db:migrate`, `bun run db:seed`.

### 2026-05-19 — Local Postgres 17 for development

Use **PostgreSQL 17** locally via `DATABASE_URL` in `.env.local`. **Neon** only when deploying staging/production (`POL-004`). Same Drizzle migrations for both.

### 2026-05-19 — Dossier + déclaration split

Assume **multiple customs filings per job**. Notion “Declarations” table → UI **Déclarations**; parent **dossier** for documents, money, grouping. See [docs/00-glossary.md](./docs/00-glossary.md).

### 2026-05-19 — Stack baseline

Next.js App Router, Tailwind v4, shadcn (to add), Drizzle, Better Auth, R2 for documents (stub OK early). Monolith `lib/modules/*`.

### 2026-05-19 — Origin

Product replaces friend’s Notion setup: **Clients**, **Declarations**, **Transactions**, customer page with **solde**.

---

## How to update this file

1. Move items in **`backlog.json`**: `todo` → `in_progress` → `done`.  
2. Add a row under **Recently completed** with date.  
3. Set **Next up** and **In progress** sections.  
4. Append to **Context log** if a decision changes direction.

---

## Key doc links

| Doc | Use when |
|-----|----------|
| [00-glossary](./docs/00-glossary.md) | Naming confusion |
| [03-mvp-scope](./docs/03-mvp-scope.md) | What ships |
| [05-domain-model](./docs/05-domain-model.md) | Rules + FSM |
| [06-data-model](./docs/06-data-model.md) | Tables |
| [10-information-architecture](./docs/10-information-architecture.md) | Routes + layouts |
| [11-user-flows](./docs/11-user-flows.md) | QA / demo script |
