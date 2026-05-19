# Glossary — Dossier vs déclaration

Canonical mental model for the product. Read this first if Notion used only a **Declarations** table.

---

## Two layers

| Layer | French (desk) | English (docs/code) | What it is |
|-------|---------------|---------------------|------------|
| **Job / case** | **Dossier** (dossier client, dossier d’import) | `dossier` | One commercial shipment operation: one client job, BL, container, shared documents and money |
| **Customs filing** | **Déclaration** (déclaration en douane) | `declaration` | One formal filing with customs for that job — initial, rectification, etc. |

```text
Client
  └── Dossier (job)          ← money & documents attach here
        ├── Déclaration 1    ← status pipeline (douane) lives here
        ├── Déclaration 2    ← e.g. rectification
        └── …
```

**Notion migration:** your friend’s **Declarations** database rows are, in most cases, **déclarations** (customs filings). When several filings belong to one shipment job, they share one **dossier**.

---

## When is there one vs many déclarations?

| Situation | Dossiers | Déclarations |
|-----------|----------|--------------|
| Simple import, one DAU | 1 | 1 (MVP default) |
| Rectification / amend | 1 | 2+ (initial + rectificative) |
| Groupage (later) | 1 | 1+ |
| Unrelated shipments | 2 | 1 each |

**Planning assumption:** structure for **many déclarations per dossier** from day one; UI still feels like today’s single “Declarations” list.

---

## UI language vs code

| Context | Use |
|---------|-----|
| **Tab nav (Déclarations tab), main list, CTA** | **Déclarations** (what Notion users already say) |
| **Parent link on a fiche** | **Dossier 2025-0042** (when job has context) |
| **Code, schema, modules** | `dossiers`, `declarations` |
| **English planning docs** | dossier = job, declaration = filing |

Do not force users to say “dossier” for daily work until they have multi-filing cases; the dossier appears as **grouping**, not a separate product vocabulary lesson.

---

## What lives where

| Concern | Dossier | Déclaration |
|---------|---------|-------------|
| Client (compte) | ✓ primary | — (via dossier) |
| BL, container, job title, type import/export/transit | ✓ | — |
| Customs ref, regime, bureau | — | ✓ |
| Status pipeline (brouillon → déposée → …) | — | ✓ |
| Case open / closed | ✓ (`open` / `closed`) | — |
| Documents (BL, factures) | ✓ (default) | optional link (DAU, quittance) |
| Ledger charges & payment allocation | ✓ | optional `declaration_id` on charge |
| Solde client | client-level | — |
| Dossier financial summary | ✓ sum across job | — |

---

## Notion tables → product

| Notion table | Product entity |
|--------------|----------------|
| Customers | `customers` |
| Declarations | `declarations` (+ auto or linked `dossier`) |
| Transactions | `ledger_entries` (+ `payment_allocations`) |
| Customer page “total solde” | computed from ledger |

---

## Routes (summary)

| User-facing | Route | Entity |
|-------------|-------|--------|
| Liste Déclarations | `/declarations` | `declarations` (+ dossier/client columns) |
| Fiche déclaration | `/declarations/[id]` | `declarations` |
| Fiche dossier (job hub) | `/dossiers/[id]` | `dossiers` |
| Clients | `/clients` | `customers` |

See [10-information-architecture.md](./10-information-architecture.md).
