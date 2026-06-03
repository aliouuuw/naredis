# Information architecture — pages & layout

See **[00-glossary.md](./00-glossary.md)**. **UI = Déclarations** (Notion). **Code = dossiers + declarations**.

---

## Site map

```
/login

/app
├── /dashboard                 ← default landing (actionable home)
├── /declarations              ← primary operational database
│   ├── /declarations/new
│   └── /declarations/[id]     ← fiche déclaration (daily work)
├── /dossiers/[id]             ← job hub (multi-filing, docs, money)
├── /clients
│   ├── /clients/new
│   └── /clients/[id]
└── /settings
```

**Default after login:** `/dashboard`

---

## App shell

**Horizontal tab navbar** (no sidebar). **Two-row header** (Vercel-style): chrome row, then nav tabs row.

```
┌──────────────────────────────────────────────────────────────────────────┐
│ [NT] Ndouckmane Transit          [ 🔍 Rechercher… ⌘K ]        [User ▾] │  ← row 1 (64px)
├──────────────────────────────────────────────────────────────────────────┤
│  Tableau de bord │ Déclarations ● │ Clients │ Réglages                   │  ← row 2 (40px)
├──────────────────────────────────────────────────────────────────────────┤
│  Page title                                    [ + action contextuelle ] │  ← PageHeader
│  ─────────────────────────────────────────────────────────────────────── │
│  Main content (full width)                                               │
└──────────────────────────────────────────────────────────────────────────┘
```

### Zone responsibilities

| Zone | Role | Contains |
|------|------|----------|
| **Chrome row** | Brand + global utilities | Logo → `/dashboard`, search (⌘K), user menu: email, **Se déconnecter**, **Apparence** (Clair / Sombre / Système) |
| **Nav row** | Primary wayfinding | Horizontal tabs only |
| **Page header** | Context for current route | `title`, optional `description`, **contextual primary action** |
| **Main** | Work surface (full width) | Tables, fiches, forms, dashboard sections |

### Tab order (left to right)

1. **Tableau de bord** — home, default after login
2. **Déclarations** — primary operational database
3. **Clients** — accounts + transactions
4. **Réglages** — org + members

Active tab: `pathname === href` or `pathname.startsWith(href + '/')` (e.g. `/declarations/new` keeps Déclarations active).

Dossiers are **not** top-level — reach via déclaration fiche, list column, or dashboard queue (`/dossiers/[id]`).

### Contextual primary actions (page header)

| Route | Primary action | Notes |
|-------|----------------|-------|
| `/dashboard` | Quick actions: **+ Nouvelle déclaration**, **+ Nouveau client** | Inline row above sections |
| `/declarations` | **+ Nouvelle déclaration** | Also in empty state + ⌘K (`POL-001`) |
| `/declarations/new` | — | Form submit is the action |
| `/declarations/[id]` | **⋯** menu | Statut, rectificative, liens dossier/client |
| `/clients` | **+ Nouveau client** | |
| `/clients/[id]` | **Enregistrer un paiement** (accountant) | `CLI-002` |
| `/dossiers/[id]` | **+ Ajouter une déclaration** (tab) / **Clôturer** (⋯) | Job hub |
| `/settings` | — | Config surface |

**Do not** put create CTAs in the tab bar.

### Global shortcuts

| Shortcut | Action |
|----------|--------|
| ⌘K | Search + quick actions (`POL-001`), incl. « Nouvelle déclaration » |

### Implementation

- `components/shell/app-top-nav.tsx` — two rows: chrome (64px) + tab nav (40px)
- `components/shell/nav-tab.tsx` — shared tab link with active styles
- `components/shell/page-header.tsx` — per-page title + actions
- `components/shell/page-actions.tsx` — shared CTA buttons
- `components/shell/theme-menu-items.tsx` — theme radio group in user dropdown
- `components/shell/theme-toggle.tsx` — login page light/dark toggle
- `components/theme-provider.tsx` — `next-themes` wrapper in root layout

**Login (`/login`):** no tab bar; `ThemeToggle` top-right. Same `ThemeProvider` as the app.

---

## Page: Liste des déclarations (`/declarations`)

**Notion analog:** the **Declarations** table.

```
Déclarations                         [ + Nouvelle déclaration ]

[ Tous ] [ En cours ] [ Docs manquants ] [ À facturer ] [ Clôturées ]

[ 🔍 ]  Client ▾  Statut ▾  Type dossier ▾        Tri: Mis à jour ▾

┌──────────┬──────────┬────────────┬────────────┬──────────┬──────────┐
│ N° décl. │ Dossier  │ Client     │ Statut     │ N° douane│ BL       │
├──────────┼──────────┼────────────┼────────────┼──────────┼──────────┤
│ DEC-0042 │ 2025-018 │ ACME SARL  │ En vérif.  │ —        │ MSKU…    │
│ DEC-0043 │ 2025-018 │ ACME SARL  │ Brouillon  │ —        │ MSKU…    │  ← rectif.
└──────────┴──────────┴────────────┴────────────┴──────────┴──────────┘
```

- Row click → `/declarations/[id]`
- Same dossier number on two rows = two filings for one job (expected)
- Empty state: « Créez votre première déclaration »

---

## Page: Fiche déclaration (`/declarations/[id]`)

**Notion analog:** opening one declaration row as a page.  
**Customs work happens here** — status stepper, douane fields.

```
← Déclarations    DEC-0042 · Rectificative          [ ⋯ ]

Dossier 2025-018 (lien)  ·  Client ACME SARL  ·  Import

┌─ Statut douane (stepper) ─────────────────────────────────────────┐
│  Brouillon → Docs → Déposée → … → Clôturée                          │
└────────────────────────────────────────────────────────────────────┘

┌─ Propriétés déclaration ───────────────────────────────────────────┐
│ Type              Rectification   │ Statut      En vérification   │
│ N° douane         (manquant ⚠)    │ Bureau      Dakar Port        │
│ Régime            —               │ Ouverte le  12 mars 2025      │
└───────────────────────────────────────────────────────────────────┘

┌─ Infos dossier (read-mostly / lien "Modifier le dossier") ─────────┐
│ BL / AWB MSKU1234567  │ Conteneur —  │ Solde dossier  450 000 XOF │
└───────────────────────────────────────────────────────────────────┘

[ Résumé ] [ Activité ]     ← déclaration-focused tabs

── Optional shortcut links ──
   Voir documents et finances du dossier →  /dossiers/[dossierId]
```

### Tab: Résumé

- Note / description for this filing
- Blocker alerts (missing n° douane, etc.)
- If dossier has **multiple déclarations**: mini-table + « Ajouter une déclaration (rectificative) »

### Tab: Activité

- Timeline for this declaration (+ rolled-up dossier events optional filter)

### Status change

Sheet: allowed next statuses only; note field; writes `declaration_status_history`.

### Header actions (`⋯`)

| Action | Notes |
|--------|-------|
| Changer le statut | FSM |
| Ajouter déclaration rectificative | Same dossier, new row |
| Ouvrir le dossier | → `/dossiers/[id]` |
| Voir le client | → `/clients/[id]` |

---

## Page: Fiche dossier (`/dossiers/[id]`)

**When:** multiple déclarations, documents, job-level money, case close.

```
← Dossier 2025-018 · Import MSKU1234567          [ ⋯ Clôturer le dossier ]

Client ACME SARL    ·  Statut dossier: Ouvert

[ Déclarations ] [ Documents ] [ Finances ] [ Activité ]

── Déclarations tab ──
┌──────────┬──────────────┬────────────┬──────────┐
│ N° décl. │ Type         │ Statut     │ N° douane│
├──────────┼──────────────┼────────────┼──────────┤
│ DEC-0041 │ Initiale     │ Clôturée   │ 12345    │
│ DEC-0042 │ Rectification│ En vérif.  │ —        │
└──────────┴──────────────┴────────────┴──────────┘
[ + Ajouter une déclaration ]

── Documents tab ── (job-level; optional link per filing)

── Finances tab ── (charges, dossier solde summary, allocations)

── Activité tab ── (all events for job)
```

---

## Page: Nouvelle déclaration (`/declarations/new`)

**Notion analog:** new row in Declarations.

```
Client*          [ ACME SARL        ▾ ]
Dossier          ( ) Nouveau dossier   ← default
                 ( ) Dossier existant [ 2025-018 ▾ ]  ← shows if client has open jobs

Type dossier     Import | Export | Transit
Type déclaration Initiale | Rectificative  (if existing dossier → default Rectificative)

BL / AWB         optional (on dossier)
Titre            optional

[ Créer ]
→ /declarations/[id]  + toast « Déclaration DEC-0044 créée »
```

**System:** always ensures a `dossier_id`; creates dossier when "Nouveau dossier".

---

## Page: Clients

**List (`/clients`):** sortable table — solde, frais dossiers (all time), transactions du jour, statut compte (`a_jour` / `pas_a_jour`).

**Fiche (`/clients/[id]`):** URL-driven tabs (`?tab=resume|transactions|declarations`). Header shows solde hero + KPIs (report jour, frais dossiers, transactions aujourd’hui). Primary CTA **Nouvelle transaction** → `?tab=transactions&record=1` (scroll to form).

| Tab | Content |
|-----|---------|
| **Résumé** | Solde, report, frais, contact, statut compte (manual reconcile) |
| **Transactions** | Record form + ledger history; link to global `/transactions` with client filter |
| **Déclarations** | BL rows for client → déclaration fiche |
| **Activité** | (planned) Client-level `activity_log` timeline |

---

## Page: Tableau de bord (`/dashboard`)

**Home for both personas.** Actionable — not just stats. Three sections.

### Section 1 — Synthèse (summary cards)

| Card | Metric |
|------|--------|
| Déclarations en cours | count |
| Dossiers ouverts | count |
| Soldes à surveiller | clients with overdue/negative balance |
| Par statut | small breakdown (optional) |

### Section 2 — À faire (priority work queue)

Cross-entity list of items needing attention. Rows link to the relevant fiche.

| Type | Trigger |
|------|---------|
| Déclaration stagnante | Status unchanged > N days |
| Déclaration sans n° douane | Past `Déposée` without `customs_reference` |
| Solde client en souffrance | Negative or overdue balance |
| Dossier prêt à clôturer | All déclarations `Clôturée` but `case_status = open` |

### Section 3 — Activité récente

Unified timeline of the last N events across déclarations, dossiers, ledger, documents — links to source entity.

**Principle:** Dashboard answers “what needs my attention?” · Déclarations list answers “show me everything.”

---

## Global search (`⌘K`)

```
Déclarations
  DEC-0042 · Rectificative · ACME
Dossiers
  2025-018 · MSKU1234567
Clients
  ACME SARL
Actions
  + Nouvelle déclaration
```

---

## Modals catalog

| ID | Purpose |
|----|---------|
| `status-change` | Declaration FSM |
| `new-declaration` | Quick create (optional) |
| `add-declaration-to-dossier` | Rectification |
| `upload-document` | On dossier |
| `add-charge` | Dossier (+ optional déclaration) |
| `record-payment` / `allocate` | Client transactions |
| `reverse-entry` | Ledger |
| `close-dossier` | Case status |

---

## Master–detail (phase 1.1 UX enhancement)

On wide screens, optional split:

```
| Liste déclarations | Fiche déclaration (selected row) |
```

Same routes; layout variant on `/declarations`. Not required for first MVP slice.

---

## Role visibility

| Action | Operator | Accountant |
|--------|----------|------------|
| Change declaration status | ✓ | ✓ |
| Add rectificative | ✓ | ✓ |
| Upload documents (dossier) | ✓ | ✓ |
| Charges / payments | read / ✗ | ✓ |
| Close dossier | ✗ | admin+ |

---

## Responsive

| Breakpoint | Nav |
|------------|-----|
| Desktop | Full horizontal tabs in top bar |
| Tablet | Scrollable tab row (`overflow-x-auto`, no wrap) |
| Mobile | Bottom tab bar: **Tableau de bord**, **Déclarations**, **Clients**, **Recherche** (Réglages in user menu) |
