# Data model (MVP)

Draft schema for Drizzle + Postgres. See **[00-glossary.md](./00-glossary.md)**.

**Dev:** apply migrations to local **PostgreSQL 17**. **Staging/prod:** Neon (same migrations).

**Do not** weaken money or tenancy columns.

## Conventions

- Primary keys: `uuid` (`gen_random_uuid()`)
- Timestamps: `created_at`, `updated_at` (`timestamptz`)
- Tenancy: `organization_id` on all business tables, indexed
- Money: `amount` as `bigint` (XOF whole francs)

---

## Tables

### `organizations` / `organization_members`

Unchanged — see prior sections in auth doc.

### `customers`

Unchanged from previous draft.

### `dossier_sequences` / `declaration_sequences`

| Column | Type |
|--------|------|
| organization_id | uuid PK |
| last_value | integer |

Two sequences, or one sequence with prefixes (`D-`, `DEC-`) — pick at implementation.

### `dossiers`

| Column | Type |
|--------|------|
| id | uuid PK |
| organization_id | uuid FK |
| customer_id | uuid FK |
| dossier_number | text |
| dossier_type | text enum |
| case_status | text enum (`open`, `on_hold`, `closed`) |
| title | text nullable |
| description | text nullable |
| bl_reference | text nullable |
| container_reference | text nullable |
| opened_at | timestamptz |
| closed_at | timestamptz nullable |
| created_at, updated_at | timestamptz |

Unique: `(organization_id, dossier_number)`  
Indexes: `(organization_id, case_status)`, `(organization_id, customer_id)`, `(organization_id, bl_reference)`

**Removed from dossier** (moved to `declarations`): `status` (customs FSM), `customs_reference`, `regime`, `bureau`.

### `declarations`

| Column | Type |
|--------|------|
| id | uuid PK |
| organization_id | uuid FK |
| dossier_id | uuid FK |
| declaration_number | text |
| kind | text enum (`initial`, `rectification`, `complement`) |
| status | text enum (customs FSM) |
| title | text nullable |
| customs_reference | text nullable |
| regime | text nullable |
| bureau | text nullable |
| opened_at | timestamptz nullable |
| closed_at | timestamptz nullable |
| version | integer default 1 |
| created_at, updated_at | timestamptz |

Unique: `(organization_id, declaration_number)`  
Indexes: `(organization_id, status)`, `(organization_id, dossier_id)`, `(organization_id, customs_reference)`

### `declaration_status_history`

| Column | Type |
|--------|------|
| id | uuid PK |
| declaration_id | uuid FK |
| from_status | text nullable |
| to_status | text |
| changed_by | uuid/text |
| changed_at | timestamptz |
| note | text nullable |

### `dossier_status_history` (optional MVP)

Case-level open/close events; can also rely on `activity_log` only for MVP.

### `ledger_entries`

| Column | Type |
|--------|------|
| id | uuid PK |
| organization_id | uuid FK |
| customer_id | uuid FK |
| dossier_id | uuid FK nullable |
| declaration_id | uuid FK nullable |
| entry_type | text enum |
| category | text enum nullable |
| amount | bigint |
| currency | char(3) default 'XOF' |
| label | text |
| effective_date | date |
| reverses_entry_id | uuid FK nullable |
| created_by | uuid/text |
| created_at | timestamptz |

Indexes: `(organization_id, customer_id, effective_date)`, `(dossier_id)`, `(declaration_id)`

### `payment_allocations`

Unchanged — `dossier_id` on allocations.

### `documents`

| Column | Type |
|--------|------|
| id | uuid PK |
| organization_id | uuid FK |
| dossier_id | uuid FK |
| declaration_id | uuid FK nullable |
| … | (same as before) |

### `activity_log`

Unchanged; `entity_type` includes `declaration` and `dossier`.

---

## SQL views

### `customer_balances`

Unchanged — sum ledger by customer.

### `dossier_financial_summary`

Per **dossier** (job): charges and allocations for `dossier_id`.

### `declaration_list_view` (optional)

Join for main UI table:

- `declarations.*`
- `dossiers.dossier_number`, `bl_reference`, `customer_id`, `customers.name`
- latest status, dossier `case_status`

---

## Seed data (dev)

- 1 organization, 2 users
- 3 customers
- 4 dossiers: 2 with one déclaration, 2 with two déclarations (rectification example)
- Ledger + allocations + documents on dossiers

---

## Better Auth tables

Unchanged — see [07-auth.md](./07-auth.md).
