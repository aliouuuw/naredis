# Domain model

See **[00-glossary.md](./00-glossary.md)** and **[13-pilot-operations.md](./13-pilot-operations.md)**.

## Entity relationship (conceptual)

```
Organization
  ├── organization_agencies (configurable maison-mère / GAINDE card holders)
  ├── Members (users + roles)
  ├── Customers
  │     └── LedgerEntries (débit/crédit, versements, …)
  ├── Dossiers (job folders)
  │     ├── Declarations (1 BL row — operational)
  │     │     ├── declaration_containers
  │     │     └── declaration_edit_log (rectificative edits)
  │     ├── Documents
  │     └── payment_allocations (from ledger)
  └── Sequences (dossier_number, declaration_number)
```

---

## Organization

Tenant boundary. All business data carries `organization_id`.

### Organization agencies

Configurable entities (agency names) used when recording which **maison-mère** paid GAINDE on a declaration. Managed in settings; not a fixed list.

| Field | Notes |
|-------|-------|
| `name` | Display name |
| `is_active` | Soft disable |

Does **not** affect client solde.

---

## User / Member

Maps to Better Auth user. Membership links user ↔ organization with **role**:

| Role | Capabilities (MVP) |
|------|---------------------|
| `owner` | All + org settings + agencies |
| `admin` | All operational + ledger |
| `operator` | Déclarations, documents, bon à délivrer |
| `accountant` | Ledger, allocations, exports |

---

## Customer

| Field | Notes |
|-------|-------|
| `name` | Required |
| `slug` | Unique per org; derived from name (desk “id”) |
| `phone`, `email`, `tax_id`, `notes` | Optional |
| `account_status` | Manual: `a_jour` \| `pas_a_jour` |
| `is_active` | Soft disable |

### Computed (never authoritative stored solde)

| Metric | Rule |
|--------|------|
| **Solde** | Net from ledger using `balance_side` (débit/crédit), agency perspective |
| **Solde side** | `debit` if client owes agency; `credit` if agency owes client |
| **Report** (day open) | Computed at start of local calendar day (`Africa/Dakar` MVP) — **no ledger row** |
| **Transactions today** | Sum of all ledger `amount` that local day |
| **Total dossier fees (all time)** | Sum of declaration `cost_price` (prix de revient) for client’s dossiers |

---

## Dossier (job folder)

| Field | Notes |
|-------|-------|
| `dossier_number` | Unique per org |
| `customer_id` | Primary client |
| `dossier_type` | `import` \| `export` \| `transit` |
| `case_status` | `open` \| `on_hold` \| `closed` |
| `bl_reference` | BL for this job (MVP: 1 BL ↔ 1 déclaration row) |
| `title`, `description` | Optional |

---

## Declaration (BL operational row)

**Primary desk object** — one row per BL shipment.

| Field | Notes |
|-------|-------|
| `declaration_number` | Unique per org |
| `dossier_id` | Parent job |
| `zone_or_terminal` | Zone or terminal |
| `declaration_date` | Business date |
| `container_count` | Count |
| `client_amount_paid` | Montant — total **client → agency** for this BL |
| `gainde_duty_amount` | GAINDE / droit de douane |
| `cost_price` | Prix de revient — agency all-in cost; **may diverge** from GAINDE |
| `paying_agency_id` | Optional FK → `organization_agencies` |
| `bon_a_delivrer` | Checkbox; requires row completeness (enforced in app) |
| `customs_reference`, `regime`, `bureau` | Optional customs metadata |
| `status` | Optional FSM — **secondary** for pilot |
| `kind` | Optional; rectificative handled via **edit + log** for pilot |

### Containers

`declaration_containers`: `container_number` per row, linked to declaration.

### Bon à délivrer

- Not part of a large customs pipeline for pilot.
- **Per declaration row (= per BL).**
- Enabled only when required fields are filled (validation in service layer).

### Rectificative

- **Edit** declaration fields in place.
- Append `declaration_edit_log` (field diffs) + `activity_log`.
- Do **not** require `kind: rectification` or a second row for pilot MVP.

### Customs FSM (optional)

Retained for future / other clients. Guards (e.g. `cleared` requires `customs_reference`) apply only when FSM UI is enabled.

---

## LedgerEntry (Transactions)

Immutable facts on a **customer** account. Filing money on declarations is **separate**.

| Field | Notes |
|-------|-------|
| `entry_type` | `versement`, `charge`, `opening_balance`, `reversal`, … extensible |
| `balance_side` | `debit` \| `credit` — agency perspective |
| `amount` | Positive integer (XOF) |
| `label` | Libellé |
| `notes` | Optional |
| `effective_date` | Date de transaction |
| `dossier_id` | Optional on entry; use **allocations** for multi-dossier |
| `reverses_entry_id` | Reversal only |

### Débit / crédit rules

| Side | Typical types | Effect on client debt |
|------|---------------|------------------------|
| `debit` | `charge`, `opening_balance` (when client owes) | Client owes more |
| `credit` | `versement` | Client owes less |

**No signed amounts.** UI shows solde as **amount + débit/crédit label**.

---

## Allocation

Links a **versement** (credit entry) to one or more **dossiers**:

- `sum(allocations) ≤ entry.amount`
- Unallocated portion stays on client account only

---

## Declaration edit log

| Field | Notes |
|-------|-------|
| `declaration_id` | |
| `changes` | JSONB field-level `{ field: { from, to } }` |
| `changed_by`, `changed_at` | Audit |

---

## Document / ActivityLog

Unchanged pattern — documents on dossier; activity on declaration edits, ledger, dossier, customer.

---

## Business rules (must enforce in code)

1. Ledger rows are never updated or deleted — only reversal.
2. `amount` > 0; direction from `balance_side` + `entry_type`.
3. Versements: `balance_side = credit`; sum(allocations) ≤ amount.
4. Declaration filing amounts (`client_amount_paid`, `gainde_duty_amount`, `cost_price`) are **not** auto-synced to ledger.
5. `bon_a_delivrer` only if required declaration fields present.
6. Declaration edits write `declaration_edit_log` when tracked fields change.
7. Every query scoped by `organization_id`.
8. **Report** at day open is **computed**, not inserted as `entry_type`.

---

## Creating work (MVP — pilot)

| User action | System behavior |
|-------------|-----------------|
| **Nouvelle déclaration** | New `dossier` + `declaration` + containers (1 BL) |
| **Rectificative** | Update declaration + `declaration_edit_log` |
| **Versement** | `ledger_entry` credit + optional multi `payment_allocations` |
