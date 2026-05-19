# MVP scope

## Goal

Ship a **credible demo** for one pilot freight forwarder: replace Notion’s **Clients**, **Declarations**, and **Transactions** tables plus Excel solde — with **dossier + déclaration** structure under the hood and **Déclarations** language in the UI.

See **[00-glossary.md](./00-glossary.md)**.

---

## In scope

### Platform

- [ ] `organization_id` on all business rows
- [ ] **Better Auth** + org membership + roles
- [ ] **Drizzle** + Neon migrations
- [ ] App-layer tenancy on every query

### Customers (Notion: Customers)

- [ ] CRUD clients, list with **solde** (computed)
- [ ] Client fiche: déclarations/dossiers rollup, ledger, relevé PDF
- [ ] Opening balance as `opening_balance` ledger entry

### Dossiers (jobs — parent container)

- [ ] `dossiers` table: client, type, BL, container, `case_status`, dossier number
- [ ] Dossier fiche: list déclarations, documents, finances (job-level), activity
- [ ] Close / reopen case (`case_status`)

### Déclarations (Notion: Declarations — **primary UI**)

- [ ] `declarations` table linked to `dossier_id`
- [ ] `declaration_number`, `kind` (`initial` | `rectification` | …)
- [ ] Customs **status FSM** on declaration — [05-domain-model.md](./05-domain-model.md)
- [ ] Status history + activity log
- [ ] **Nouvelle déclaration** → creates dossier + first declaration (default)
- [ ] **Ajouter déclaration** on existing dossier (rectification path)
- [ ] Main list `/declarations` with filters (statut, client, dossier #)
- [ ] Fiche `/declarations/[id]` — status stepper, customs fields

### Ledger (Notion: Transactions)

- [ ] Immutable entries; categories honoraires / débours / other
- [ ] Charges on `dossier_id`; optional `declaration_id`
- [ ] Payments + **allocations** to dossier(s)
- [ ] No editable solde field

### Documents

- [ ] R2 upload; `dossier_id` required; optional `declaration_id`
- [ ] Typed documents + simple versioning

### Activity

- [ ] `activity_log` on declaration, dossier, customer, ledger events
- [ ] Timeline on declaration fiche + dossier fiche

### UI / exports

- [ ] Shell: nav **Déclarations** (primary), **Clients**, Dashboard, Réglages
- [ ] CTA **+ Nouvelle déclaration**
- [ ] Global search: declaration #, dossier #, client, BL, customs ref
- [ ] PDF relevé de compte

### Developer experience

- [ ] Seed: multi-declaration dossier example
- [ ] Zod on server boundaries
- [ ] README → `docs/`

---

## Out of scope (defer)

| Feature | Defer to |
|---------|----------|
| Configurable workflow stages per company | Phase 2 |
| `dossier_parties` (groupage / multi-importer) | Phase 2 |
| Full double-entry GL | When accountant requires |
| OCR / AI | Phase 3 |
| WhatsApp / email ingest | Phase 3 |
| ASYCUDA / customs API | Phase 4+ |
| Advanced analytics | Phase 3 |
| Client portal | Post-PMF |
| Invoicing / VAT lines | Phase 2 |

**Removed from defer:** multiple déclarations per dossier — **in MVP**.

---

## MVP screens

| Route | Purpose |
|-------|---------|
| `/login` | Auth |
| `/dashboard` | Summary (managers) |
| `/declarations` | **Main list** (Notion Declarations DB) |
| `/declarations/new` | New déclaration (+ dossier) |
| `/declarations/[id]` | Fiche déclaration (status, customs) |
| `/dossiers/[id]` | Job hub: all déclarations, docs, $ |
| `/clients` | Client list |
| `/clients/[id]` | Client fiche |
| `/settings` | Org + members |

**Default after login:** `/declarations`

---

## Definition of done

- [ ] Pilot completes happy path using **déclaration** language
- [ ] Rectification: second déclaration on same dossier works
- [ ] Solde matches ledger in SQL
- [ ] Invalid status transitions blocked
- [ ] Documents org-scoped; deployed staging
