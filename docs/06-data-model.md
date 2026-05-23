# Data model (MVP)

Drizzle + Postgres. See **[13-pilot-operations.md](./13-pilot-operations.md)** for pilot field meanings.

**Dev:** PostgreSQL 17 local. **Staging/prod:** Neon.

**Do not** weaken tenancy or store authoritative signed solde.

## Conventions

- PK: `uuid`
- Timestamps: `timestamptz`
- Tenancy: `organization_id` on business tables
- Money on declarations / ledger: `bigint` XOF whole francs, **always positive**
- Ledger direction: `balance_side` enum (`debit` | `credit`), not signed `amount`

---

## Tables

### `organizations` / `organization_members`

Unchanged — see [07-auth.md](./07-auth.md).

### `organization_agencies`

| Column | Type |
|--------|------|
| id | uuid PK |
| organization_id | uuid FK |
| name | text |
| is_active | boolean default true |
| notes | text nullable |
| created_at, updated_at | timestamptz |

Unique: `(organization_id, name)`  
Configurable in settings (maison-mère / GAINDE card holder names).

### `customers`

| Column | Type |
|--------|------|
| id | uuid PK |
| organization_id | uuid FK |
| name | text |
| slug | text — unique per org, from name |
| phone, email, tax_id, notes | optional |
| account_status | enum `a_jour` \| `pas_a_jour` (manual) |
| is_active | boolean |
| created_at, updated_at | timestamptz |

Unique: `(organization_id, slug)`

### `dossiers`

| Column | Type |
|--------|------|
| id | uuid PK |
| organization_id | uuid FK |
| customer_id | uuid FK |
| dossier_number | text |
| dossier_type | enum |
| case_status | enum |
| bl_reference | text nullable |
| title, description | text nullable |
| opened_at, closed_at | timestamptz |
| created_at, updated_at | timestamptz |

Unique: `(organization_id, dossier_number)`

### `declarations`

| Column | Type |
|--------|------|
| id | uuid PK |
| organization_id | uuid FK |
| dossier_id | uuid FK |
| declaration_number | text |
| zone_or_terminal | text nullable |
| declaration_date | date nullable |
| container_count | integer nullable |
| client_amount_paid | bigint nullable — montant (client → agency) |
| gainde_duty_amount | bigint nullable — GAINDE |
| cost_price | bigint nullable — prix de revient |
| paying_agency_id | uuid FK nullable → organization_agencies |
| bon_a_delivrer | boolean default false |
| bon_a_delivrer_at | timestamptz nullable |
| kind | enum (optional metadata) |
| status | enum (optional FSM) |
| customs_reference, regime, bureau, title | text nullable |
| opened_at, closed_at, version | timestamptz / int |
| created_at, updated_at | timestamptz |

Unique: `(organization_id, declaration_number)`

### `declaration_containers`

| Column | Type |
|--------|------|
| id | uuid PK |
| declaration_id | uuid FK cascade |
| organization_id | uuid FK |
| container_number | text |
| sort_order | integer default 0 |

Index: `(declaration_id)`

### `declaration_edit_log`

| Column | Type |
|--------|------|
| id | uuid PK |
| organization_id | uuid FK |
| declaration_id | uuid FK cascade |
| changes | jsonb — `{ "field": { "from": "…", "to": "…" } }` |
| changed_by | text nullable |
| changed_at | timestamptz |

### `declaration_status_history`

Optional; used when FSM transitions are recorded.

### `ledger_entries`

| Column | Type |
|--------|------|
| id | uuid PK |
| organization_id | uuid FK |
| customer_id | uuid FK |
| dossier_id | uuid FK nullable |
| declaration_id | uuid FK nullable |
| entry_type | enum (`versement`, `charge`, `opening_balance`, `reversal`, …) |
| balance_side | enum `debit` \| `credit` |
| category | enum nullable |
| amount | bigint — always positive |
| currency | char(3) default XOF |
| label | text |
| notes | text nullable |
| effective_date | date |
| reverses_entry_id | uuid nullable |
| created_by | text |
| created_at | timestamptz |

### `payment_allocations`

Unchanged: `ledger_entry_id`, `dossier_id`, `amount`, `organization_id`.

### `documents` / `activity_log` / sequences

Unchanged pattern; see existing migrations.

---

## SQL views (computed)

### `customer_balance`

Per customer: `total_debit`, `total_credit`, `net_amount`, `balance_side` (`debit` if client owes agency).

### `customer_day_open_balance` (report)

Net balance at **start** of given local date (`Africa/Dakar`) — not a table row.

### `customer_transactions_today`

Sum of `amount` for all `entry_type` on local calendar day.

### `customer_declaration_fees_all_time`

Sum of `declarations.cost_price` for customer’s dossiers.

### `declaration_list_view`

Join: declarations + dossiers + customers + container count + paying agency name.

---

## Seed data (dev)

- 1 org, agencies sample, 3 customers with slugs
- Dossiers + declarations with zone, containers, filing amounts, one `bon_a_delivrer` example
- Ledger with `balance_side` + `versement` (not `payment`)
- Rectificative example via `declaration_edit_log` optional

---

## Better Auth tables

See [07-auth.md](./07-auth.md).
