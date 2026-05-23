# Glossary — Dossier vs déclaration

Canonical mental model for the product. Read **[13-pilot-operations.md](./13-pilot-operations.md)** for the anchor client’s desk fields.

---

## Two layers

| Layer | French (desk) | English (docs/code) | What it is |
|-------|---------------|---------------------|------------|
| **Job / case** | **Dossier** | `dossier` | Parent folder for a client operation (BL, shared context). Grows over time. |
| **BL row (desk)** | **Déclaration** | `declaration` | **One Notion row = one BL shipment** — zone, containers, filing money, bon à délivrer |

```text
Client
  └── Dossier (job folder)
        └── Déclaration(s)   ← MVP: usually 1 per dossier (1 BL)
              zone, containers[], montant, GAINDE, prix de revient,
              paying agency, bon à délivrer ✓
```

**Pilot:** rectificative = **edit same row** + `declaration_edit_log`, not a second row.

---

## When is there one vs many déclarations?

| Situation | Dossiers | Déclarations |
|-----------|----------|--------------|
| Normal import, one BL | 1 | 1 |
| Rectificative (pilot) | 1 | 1 (same row, edited + log) |
| Future: second filing on same job | 1 | 2+ (if client asks) |
| Unrelated shipments | 2 | 1 each |

---

## UI language vs code

| Context | Use |
|---------|-----|
| **Tab nav, main list, CTA** | **Déclarations** |
| **Parent link on fiche** | **Dossier** (when useful) |
| **Code, schema** | `dossiers`, `declarations` |

---

## What lives where

| Concern | Dossier | Déclaration |
|---------|---------|-------------|
| Client (compte) | ✓ | via dossier |
| BL reference | ✓ | — (1 BL per row) |
| Zone / terminal, containers | — | ✓ |
| Montant, GAINDE, prix de revient | — | ✓ (not in Transactions) |
| Maison-mère (paying agency) | — | ✓ (informational) |
| Bon à délivrer | — | ✓ checkbox |
| Customs FSM (optional) | — | ✓ secondary for pilot |
| Case open / closed | ✓ | — |
| Documents | ✓ default | optional link |
| Transactions (versements, …) | allocations | — |
| Client solde | computed (débit/crédit) | — |

---

## Notion tables → product

| Notion table | Product entity |
|--------------|----------------|
| Customers | `customers` (+ computed solde, daily totals) |
| Declarations | `declarations` + `dossiers` + `declaration_containers` |
| Transactions | `ledger_entries` (`balance_side` débit/crédit) + `payment_allocations` |
| Report (morning solde) | **Computed view** at day open — **not** a stored row |
| “Report” in Notion | See [13-pilot-operations.md](./13-pilot-operations.md) |

---

## Routes (summary)

| User-facing | Route | Entity |
|-------------|-------|--------|
| Liste Déclarations | `/declarations` | `declarations` (+ dossier/client) |
| Fiche déclaration | `/declarations/[id]` | `declarations` |
| Fiche dossier | `/dossiers/[id]` | `dossiers` |
| Clients | `/clients` | `customers` |
| Réglages (agencies) | `/settings` | `organization_agencies` |

See [10-information-architecture.md](./10-information-architecture.md).
