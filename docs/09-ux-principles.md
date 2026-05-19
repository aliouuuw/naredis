# UX principles — Notion familiarity, operational rigor

Primary persona: **heavy Notion user** with **Clients**, **Declarations**, and **Transactions** tables.

Design goal: **feel like upgrading Notion**, not learning ERP software.

See **[00-glossary.md](./00-glossary.md)** — UI says **Déclarations**; dossier is the job container.

---

## What Notion does well (keep the feel)

| Notion pattern | Our equivalent |
|----------------|----------------|
| Sidebar + databases | **Horizontal tab nav** (Tableau de bord, Déclarations, Clients, Réglages) |
| Main database = Declarations | **`/declarations` list** (primary operational DB) |
| Row opens full page | **Fiche déclaration** |
| Properties at top | Property strip (statut, n° douane, client, dossier, BL) |
| Relation to client | Client link; client page shows related déclarations |
| Transactions related DB | **Comptabilité** on client + **Finances** on dossier |
| Formula “solde” | **Solde calculé** from ledger |
| Filters / sorts | Presets on déclarations list |
| ⌘K | Global search |

---

## Where Notion fails (improve deliberately)

| Pain in Notion | Our improvement |
|----------------|-----------------|
| One flat Declarations table hides job grouping | **Dossier** groups filings; link visible when 2+ déclarations |
| Balance typed manually | Ledger-only solde |
| Status = free select | **Declaration** FSM with guards |
| Rectification = duplicate row with no link | `kind: rectification` + same **dossier** |
| Documents in comments | Documents tab on dossier |
| No audit trail | Activité timeline |

---

## Design principles

1. **Dashboard-first navigation** — `/dashboard` is the default landing for all personas; **horizontal tab navbar** (Tableau de bord, Déclarations, Clients, Réglages) — no left sidebar.
2. **Actionable home** — Tableau de bord is a workbench (synthèse, à faire, activité récente), not a stats wall.
3. **Contextual create actions** — “+ Nouvelle déclaration” on the déclarations list (and as a dashboard quick action); never in the global tab bar.
4. **Dossier appears when useful** — breadcrumb, column, or hub when multiple filings or money/docs context.
5. **French UI** — Déclaration, Dossier, Statut, Solde, etc.
6. **Status on the filing** — stepper on fiche déclaration, not ambiguous job-level status.
7. **Money on the job** — charges/allocations at dossier; optional link to déclaration on charge.
8. **Confirm money actions** — forms, not inline grid editing.

---

## Notion → product mapping

| Notion | Product |
|--------|---------|
| Customers table | `/clients` |
| Declarations table | `/declarations` |
| Transactions table | `ledger_entries` (UI: écritures / transactions) |
| Customer page rollup | Client fiche tabs |
| New declaration row | **+ Nouvelle déclaration** |

---

## Visual language

Notion-like density, status pills, stepper on **déclaration** fiche, XOF formatting, shadcn. **Vercel-inspired** shell (Geist, two-row header, design tokens in `globals.css`). **Theme:** Clair / Sombre / Système via profile menu; compact sun/moon toggle on `/login` (`next-themes`).

---

## Accessibility & context

Desktop-first; `Africa/Dakar`; status pills include text labels.
