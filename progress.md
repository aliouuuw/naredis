# Progress — Naredis (MVP)

Living status for the MVP. **Backlog:** [`backlog.json`](./backlog.json) (update `status` as work completes).

**Last updated:** 2026-06-03

---

## Current phase

**Pilot desk alignment** (client call 2026-06-03) — operator declaration numbers, client account journal on Résumé, reste on fiches, transaction UX fixes. See [docs/13-pilot-operations.md](./docs/13-pilot-operations.md).

**Next up:** `DOS-002` document upload, `POL-001` search.

Shell is now tab-based (`UI-004`); dashboard is default landing.

---

## Snapshot

| Area | Status |
|------|--------|
| Next.js 16 scaffold | Done |
| Planning docs (`docs/`) | Done |
| `backlog.json` / `progress.md` | Done |
| Local PostgreSQL 17 | Done |
| Drizzle + schema (pilot 0003, review 0004) | Done |
| Unit tests (`bun test`, domain + slug + ledger) | Done (35+) |
| Product branding (Naredis) + login panel | Done |
| CLI-003 opening balance + contre-passation | Done |
| DECL-001 list filters + column order | Done |
| UI-006 editable list columns (localStorage) | Done |
| CLI-004 relevé Excel export | Done |
| DECL-003 fiche Activité tab | Done |
| DOS-001 dossier hub tabs + close | Done |
| DOS-003 dossier finances (charges / payé / reste) | Done |
| POL-002 actionable dashboard | Done |
| CLI-001 client fiche (Activité tab) | Done |
| Review fixes (audit log, N+1, sequences, BL unique, roles) | Done |
| Dev seed data | Done — pilot-shaped; `bun run db:reseed` |
| Better Auth | Done |
| Tenancy helpers (`requireAuthContext`) | Done |
| shadcn + app shell (PLAT-008) | Done |
| Shell IA: tab nav + dashboard landing (UI-004) | Done |
| Theme switcher (UI-005) | Done |
| Domain modules (DOM-002–004, 008) | Done — list/fiche read UI wired |
| Create forms (client + déclaration) | Done |
| Declaration edit + BAD toggle UI (`DECL-005`) | Done |
| Ledger module + payment UI (`DOM-005`, `CLI-002`) | Done |
| Client fiche (`CLI-001`) | Résumé, Transactions, Déclarations, Activité |
| Pilot declaration # + reste | Operator format `1-18N-D001`; reste computed; zones from pilot list |
| Transaction UX fixes | Type label in selects; `/transactions` Nouvelle transaction with client picker; types rename |
| Transactions module | Types extensibles, filtres URL, regroupement imbriqué |

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
| **Money** | Ledger débit/crédit + `versement`; filing amounts on declaration; report computed at day open |
| **Pilot ops** | [docs/13-pilot-operations.md](./docs/13-pilot-operations.md) |

---

## MVP definition of done

From [docs/03-mvp-scope.md](./docs/03-mvp-scope.md):

- [ ] Pilot completes happy path in **déclaration** language
- [ ] Rectificative: edit declaration row + audit log
- [ ] Client solde matches ledger
- [ ] Invalid customs status transitions blocked
- [ ] Documents org-scoped
- [ ] Deployed staging (Neon + Vercel) when ready for external pilot

---

## Suggested implementation order (pilot)

After the 2026-06-03 alignment pass:

1. **DOS-002** — document upload on dossier  
2. **POL-001** — Cmd+K search  
3. **Later** — DECL-004 FSM (defer), POL-004 staging, CLI-004 PDF, list pagination  

---

## Pilot alignment (2026-06-03) — shipped

| Item | Status |
|------|--------|
| Declaration # operator format | Done |
| Reste (marge) on fiches | Done (computed) |
| Hide n° douane / bureau; no dossier type on create | Done |
| Client Résumé = account journal | Done |
| FormSelect shows type name | Done |
| Nouvelle transaction from `/transactions` | Done (client picker in dialog) |
| Transaction types rename | Done |

| Item | Deferred |
|------|----------|
| Configurable zones in Settings | Backlog (hardcoded pilot list) |

---

---

## Recently completed

| ID | Title | Date |
|----|-------|------|
| — | Naredis branding + login product panel | 2026-06-03 |
| CLI-003 | Opening balance + contre-passation UI | 2026-06-03 |
| DECL-001 | Declarations list filters, presets, URL sync, Reste column | 2026-06-03 |
| DECL-003 | Declaration fiche Activité tab (activity_log) | 2026-06-03 |
| PLAT-001 | PostgreSQL 17 local dev + DATABASE_URL | 2026-05-19 |
| PLAT-002 | Drizzle ORM setup + migration scripts | 2026-05-19 |
| PLAT-003 | Core schema (orgs, customers, dossiers, declarations) | 2026-05-19 |
| PLAT-004 | Ledger, allocations, documents, activity_log | 2026-05-19 |
| PLAT-005 | Better Auth + organization plugin | 2026-05-19 |
| PLAT-006 | Tenancy helpers (requireAuthContext) | 2026-05-19 |
| PLAT-007 | Dev seed script | 2026-05-19 |
| PLAT-008 | shadcn/ui + app shell baseline | 2026-05-19 |
| UI-002   | App sidebar + Vercel design  | 2026-05-19 |
| UI-003   | Shell IA: PageHeader + contextual CTAs | 2026-05-19 |
| UI-004   | IA v2: tab navbar + dashboard landing | 2026-05-19 |
| UI-005   | Theme switcher (profile + login) | 2026-05-19 |
| PLAT-011 | Pilot operations schema (0003) | 2026-05-23 |
| DOM-002–004, 008 | Module services + list/fiche pages | 2026-05-23 |
| — | Review fixes: migration 0004, aggregates, audit, tests | 2026-05-23 |
| DECL-001 | Declarations list page | 2026-06-03 |
| DECL-005 | Edit declaration + audit timeline UI | 2026-06-03 |
| DOM-005 | Ledger module (versements, allocations) | 2026-06-03 |
| CLI-002 | Payment + allocation UI on client fiche | 2026-06-03 |
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

### 2026-06-03 — Checkpoint (review fixes committed)

Migration **0004**: year-scoped `dossier_sequences` / `declaration_sequences`, partial unique on `dossiers.bl_reference`. `updateDeclaration` locks row, logs containers in `declaration_edit_log`, BAD validation inside tx. `listCustomers` single aggregated query. Create actions use `requireRole`. `bun test` (10) for balance, BAD rules, slug.

**Backlog sync:** `DECL-001` → done; `DECL-003`, `CLI-001`, `DOS-001` → in_progress with notes on remaining AC.

### 2026-05-23 — Create forms (DECL-002, client new)

Server actions + `NewCustomerForm` and `NewDeclarationForm` (BL, containers, montants, agency). Redirect to fiche on success.

### 2026-05-23 — Domain modules + read UI

`lib/modules/*` (dossiers, declarations, customers, agencies, activity), `lib/domain/balance`, declaration completion rules. Pages: `/declarations` table, `/declarations/[id]`, `/clients` table, `/clients/[id]` (solde, report, frais, transactions jour), `/dossiers/[id]`, settings agencies list.

### 2026-05-23 — Pilot operations aligned (docs + schema 0003)

Anchor client model captured in [docs/13-pilot-operations.md](./docs/13-pilot-operations.md): 1 declaration row = 1 BL; montant / GAINDE / prix de revient on row; bon à délivrer checkbox; configurable `organization_agencies`; rectificative = edit + `declaration_edit_log`; ledger uses `balance_side` débit/crédit and `versement`; **report** computed at day open (no ledger row). Migration `0003`, seed updated.

### 2026-05-19 — Theme switcher (UI-005)

`next-themes` + `ThemeProvider` in root layout. Profile menu **Apparence**: Clair / Sombre / Système. Login page: compact sun/moon `ThemeToggle`. Documented in `docs/02`, `docs/09`, `docs/10`, `docs/12`.

### 2026-05-19 — IA v2: tab nav + dashboard landing (UI-004)

Replaced left sidebar with a **two-row** `AppTopNav` (Vercel-style): chrome row (logo, search, user) + tab row. Tabs: Tableau de bord, Déclarations, Clients, Réglages. Default landing `/dashboard` with stub sections — data in `POL-002` (p0). Logout: `signOut()` + `window.location.assign('/login')`. Updated `docs/07`, `docs/10`, `docs/09`, `docs/11`, `docs/03`, `docs/12`.

### 2026-05-19 — Shell IA rethink (UI-003)

Sidebar = nav only (Déclarations-first order). Primary create actions moved to `PageHeader` per route. Updated `docs/10`, `docs/09`, `docs/12`, backlog.

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
| [13-pilot-operations](./docs/13-pilot-operations.md) | Anchor client fields |
