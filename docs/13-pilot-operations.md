# Pilot operations (anchor client)

Canonical desk model from the pilot freight forwarder (Dakar). Supersedes generic assumptions in older doc drafts where they conflict.

**Related:** [00-glossary](./00-glossary.md), [05-domain-model](./05-domain-model.md), [06-data-model](./06-data-model.md).

---

## Three Notion-style tracks

| Track | Product | Purpose |
|-------|---------|---------|
| **Declarations** | `declarations` (+ `dossiers`, `declaration_containers`) | One **row per BL shipment** — logistics, filing money, delivery gate |
| **Transactions** | `ledger_entries` + `payment_allocations` | Client **account** (versements, charges, …) — **not** filing economics |
| **Clients** | `customers` + computed rollups | Identity, **solde** (débit/crédit), manual **à jour**, aggregates |

---

## Declarations (one row = one BL)

| Field (desk) | Code | Notes |
|--------------|------|-------|
| Unique id | `declaration_number` | **Operator-assigned**, format `{prefix}-{zone}-D{suffix}` (e.g. `1-18N-D001`). Prefix and suffix are typed; zone comes from the org zone list (`lib/domain/pilot-zones.ts`, settings later). Unique per org. |
| Zone / terminal | `zone_or_terminal` | Slug/code embedded in the declaration number (same as selected zone at create). |
| Client | via `dossier.customer_id` | Compte client |
| BL | `dossiers.bl_reference` | One BL per row (1 dossier ↔ 1 BL in MVP) |
| Date of declaration | `declaration_date` | Business date |
| Container count | `container_count` | Integer |
| Container id(s) | `declaration_containers` | One row per container number |
| **Montant** | `client_amount_paid` | **Total client paid agency** for this BL |
| **Droit de douane (GAINDE)** | `gainde_duty_amount` | Customs duty via GAINDE |
| **Prix de revient** | `cost_price` | Agency all-in cost (customs + fees paid for dossier); **may diverge** from GAINDE alone |
| **Reste (marge)** | computed | `client_amount_paid − cost_price` (UI only, not stored). Shown on create/edit fiche. |
| **Maison-mère** | `paying_agency_id` → `organization_agencies` | Which agency entity used its GAINDE card — **informational only**, does not change solde |
| **Bon à délivrer** | `bon_a_delivrer` | **Checkbox** (not a customs pipeline stage). Per BL row. All required row fields filled before it can be checked |

Filing economics (**montant**, GAINDE, prix de revient) live **only on the declaration row**, not duplicated as ledger lines unless you later choose to.

**Not used in pilot UI (schema may retain):** `customs_reference` (n° douane), `bureau`, dossier import/export/transit on create.

### Rectificative

- **Do not** require a second declaration row for corrections.
- **Edit the same row**; append **`declaration_edit_log`** (field-level diff) + `activity_log`.
- Optional `kind` / customs FSM remain for future; pilot gate is **bon à délivrer** + complete row.

### Customs pipeline (secondary for pilot)

Generic FSM (`draft` → `submitted` → …) may stay in schema but is **not** the primary desk workflow for this pilot. Delivery readiness = **`bon_a_delivrer`**.

---

## Transactions (client account)

| Field (desk) | Code | Notes |
|--------------|------|-------|
| Unique id | ledger id / display | |
| Client | `customer_id` | Required |
| Libellé | `label` | |
| Dossier(s) | `payment_allocations` (0..n) | Multi-dossier allowed |
| Date | `effective_date` | |
| Type | `entry_type` | e.g. **`versement`** (client deposit), **`charge`**, extensible |
| Montant | `amount` | Always **positive**; use **`balance_side`** |
| Notes | `notes` | |

### Report (Notion “report”)

- **Not stored** as a ledger row.
- **Computed** at **day open** (calendar date, agency timezone — `Africa/Dakar`): net client solde from ledger as of start of that local day.
- Shown on client dashboard alongside **total transactions today** (sum of all entry types that local day).

### Balance model — débit / crédit (no signed amounts)

Agency perspective:

| `balance_side` | Meaning |
|----------------|---------|
| `debit` | Client **owes** the agency more (charges, opening balance debit, …) |
| `credit` | Client **paid** or agency **credits** the account (`versement`, …) |

**Solde display:** net amount + side (`débit` if net client debt, `crédit` if net agency owes client). Implement as computed columns/views, not a stored signed integer.

---

## Clients

| Field (desk) | Code | Notes |
|--------------|------|-------|
| Id | `slug` | Derived from name (unique per org) |
| Name | `name` | |
| Phone | `phone` | |
| Solde | computed | From ledger débit/crédit |
| Solde status | computed | Débit / crédit label from net |
| Total dossier fees (global) | computed | **All time** — sum of declaration `cost_price` (prix de revient) |
| Total transactions today | computed | **All types**, calendar day in `Africa/Dakar` |
| Status | `account_status` | Manual: `a_jour` \| `pas_a_jour` (“accounts reconciled”) |

### Client fiche — tab **Résumé** (journal du compte)

Single timeline for the account:

- **Ledger entries** (transactions) — affect running **solde** (débit/crédit net).
- **Declarations** for the client — informational in the journal (montant, reste, BL, BAD); **do not** post to the ledger.
- Grouped by calendar day (`Africa/Dakar`), newest days first; within a day, newest events first.
- Each row shows **solde après** (balance after that point in chronological order) and deep-links to transaction or declaration fiche.
- Separate tabs **Transactions** and **Déclarations** remain for full tables and actions.

### Transaction types

- Org-configurable types (`ledger_transaction_types`): create + **rename** in the Nouvelle transaction flow.
- System types (versement, charge, …) keep stable `code` / `system_key`; display name is editable.

---

## Configurable agencies (maison-mère)

Forwarders may have **multiple agency entities**, each with its own GAINDE card.

- Table: `organization_agencies` (name, active flag).
- Configured in **Settings** by owner/admin (not a fixed enum).
- Referenced from declarations as `paying_agency_id`.

---

## Dossier (parent folder)

- **Concept:** container for a client job; **déclaration** is the operational BL row today.
- MVP: creating a déclaration creates **dossier + déclaration** together (1 BL).
- Future dossier-only operations TBD with client.

---

## Timezone

All **“today”** rollups use **`Africa/Dakar`** for the organization (MVP default for pilot).
