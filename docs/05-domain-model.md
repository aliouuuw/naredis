# Domain model

See **[00-glossary.md](./00-glossary.md)** for dossier (job) vs déclaration (customs filing).

## Entity relationship (conceptual)

```
Organization
  ├── Members (users + roles)
  ├── Customers
  │     ├── LedgerEntries
  │     └── Dossiers
  ├── Dossiers (jobs)
  │     ├── Declarations (1..n customs filings)
  │     ├── Documents (primarily dossier-level)
  │     ├── LedgerEntries (charges; allocations at dossier level)
  │     ├── DossierStatusHistory (case open/close)
  │     └── ActivityLog
  ├── Declarations
  │     ├── DeclarationStatusHistory
  │     └── (optional) Documents
  └── Sequences (dossier_number, declaration_number)
```

MVP: **one primary customer per dossier**. Phase 2: `dossier_parties` for groupage / multi-importer.

---

## Organization

Tenant boundary. All business data carries `organization_id`.

## User / Member

Maps to Better Auth user. Membership links user ↔ organization with **role**:

| Role | Capabilities (MVP) |
|------|---------------------|
| `owner` | All + org settings |
| `admin` | All operational + ledger |
| `operator` | Déclarations, documents, status (no reversals) |
| `accountant` | Ledger, allocations, exports |

---

## Customer

Commercial client of the forwarder (compte client).

| Field | Notes |
|-------|-------|
| `name` | Required |
| `code` | Optional short code |
| `email`, `phone` | Optional |
| `tax_id` | NINEA or equivalent |
| `notes` | Free text |
| `is_active` | Soft disable |

**Solde**: never stored as authoritative; computed from ledger.

---

## Dossier (job / shipment file)

Container for one client operation. **Not** the customs status pipeline — that lives on déclarations.

| Field | Notes |
|-------|-------|
| `dossier_number` | Display ID, unique per org |
| `customer_id` | Primary client |
| `dossier_type` | `import` \| `export` \| `transit` |
| `case_status` | `open` \| `on_hold` \| `closed` |
| `title` / `description` | Short label for the job |
| `bl_reference` | Bill of lading / AWB |
| `container_reference` | Optional |
| `opened_at`, `closed_at` | Timestamps |

### Case status (dossier-level)

| Status | Label (FR) | Meaning |
|--------|------------|---------|
| `open` | Ouvert | Job in progress |
| `on_hold` | En suspens | Paused (client, payment, etc.) |
| `closed` | Clôturé | Job finished |

Closing a dossier may require all déclarations terminal and no blocking balance (warnings in MVP).

---

## Declaration (customs filing)

**Primary operational object** for desk work (matches Notion “Declarations” table).

| Field | Notes |
|-------|-------|
| `declaration_number` | Display ID, unique per org |
| `dossier_id` | Parent job (required) |
| `kind` | `initial` \| `rectification` \| `complement` |
| `status` | Customs FSM state |
| `customs_reference` | Numéro déclaration douanière |
| `regime` | Optional |
| `bureau` | Customs office |
| `title` | Optional label (e.g. “Rectificative mars”) |
| `opened_at`, `closed_at` | Optional |

### Status machine (import — MVP)

Applies to **declaration**, not dossier.

| Status | Label (FR) | Typical meaning |
|--------|--------------|-----------------|
| `draft` | Brouillon | Filing prepared |
| `documents_pending` | Documents en attente | Collecting pieces |
| `submitted` | Déposée | Filed with customs |
| `under_review` | En vérification | Customs review |
| `cleared` | Liquidée / dégagée | Duties assessed / released |
| `delivered` | Marchandises retirées | Goods collected |
| `invoiced` | Facturé | Agency invoice issued |
| `closed` | Clôturée | Filing complete |

Guards (examples):

- `cleared` requires `customs_reference`
- `submitted` may require key dossier documents (config later)

### Declaration status history

Same pattern as before: `from_status`, `to_status`, `changed_by`, `note`.

---

## LedgerEntry

Immutable financial fact on a **customer** account.

| Field | Notes |
|-------|-------|
| `entry_type` | `charge` \| `payment` \| `opening_balance` \| `reversal` |
| `amount` | Positive integer; sign derived from type |
| `currency` | Default `XOF` |
| `category` | `honoraires` \| `debours` \| `other` (charges) |
| `label` | Description |
| `effective_date` | Business date |
| `dossier_id` | Required for charges in MVP; target for allocations |
| `declaration_id` | Optional — attribute charge to a specific filing |
| `reverses_entry_id` | Set on reversal rows |

### Sign convention

| Type | Effect on client solde |
|------|------------------------|
| `charge`, `opening_balance` (debit) | Client owes more (+) |
| `payment` | Client owes less (−) |
| `reversal` | Offsets a prior entry |

(Confirm sign with pilot accountant.)

---

## Allocation

Links a **payment** entry to a **dossier** (amount portion).

- One payment → many dossiers.
- Unallocated amount stays on client account.
- Allocations are at **dossier** level (job money), not split per déclaration in MVP.

---

## Document

| Field | Notes |
|-------|-------|
| `dossier_id` | Required |
| `declaration_id` | Optional (DAU, quittance tied to one filing) |
| `document_type` | Enum |
| `storage_key` | R2 path |
| `version` | Increment on replace |
| `source` | `client` \| `agent` \| `customs` |
| `status` | `pending` \| `active` \| `archived` |

### Document types (seed list)

- `bill_of_lading`
- `commercial_invoice`
- `packing_list`
- `customs_declaration`
- `customs_receipt` (quittance)
- `delivery_order`
- `agency_invoice`
- `other`

---

## ActivityLog

| Field | Notes |
|-------|-------|
| `entity_type` | `dossier` \| `declaration` \| `customer` \| `ledger_entry` |
| `entity_id` | UUID |
| `action` | e.g. `declaration.status_changed`, `ledger.payment_recorded` |
| `payload` | JSONB |
| `actor_id` | User id |

---

## Business rules (must enforce in code)

1. Ledger rows are never updated or deleted — only reversal.
2. Payments: sum(allocations) ≤ payment amount.
3. Charges in MVP must reference a `dossier_id`.
4. **Declaration** status transitions use the customs FSM — no arbitrary writes.
5. Every déclaration belongs to exactly one dossier.
6. Creating a déclaration without an existing dossier **creates a dossier** in the same transaction (MVP default).
7. `dossier_number` and `declaration_number` generated in DB transactions (per-org sequences).

---

## Creating work (MVP behavior)

| User action | System behavior |
|-------------|-----------------|
| **Nouvelle déclaration** | New `dossier` + first `declaration` (`kind: initial`) |
| **Ajouter déclaration (rectificative)** | New `declaration` on existing `dossier` (`kind: rectification`) |
| **Nouveau dossier** (advanced / optional UI) | New `dossier` only; user adds déclaration after |

Default path matches Notion: **new row in Declarations** = new déclaration.
