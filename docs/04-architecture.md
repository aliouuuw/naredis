# Architecture

See **[00-glossary.md](./00-glossary.md)** for dossier vs déclaration.

## Principles

1. **Monolith first** — one Next.js app; clear module folders.
2. **Postgres is truth** — customs status on `declarations`; money on `ledger_entries`.
3. **Immutable money** — reversals only.
4. **Thin routes, thick services**.
5. **Framework-free domain** — declaration FSM + money rules in `lib/domain/`.

## Request flow

```
Browser → Next.js → Better Auth session + org
       → Zod DTO
       → Module service (db.transaction)
       → Drizzle / R2
       → activity_log
       → Response
```

## Module boundaries

| Module | Responsibility |
|--------|----------------|
| `customers` | Client CRUD, client fiche |
| `dossiers` | Job CRUD, case_status, numbering, dossier hub |
| `declarations` | Filing CRUD, **customs FSM**, numbering, main list queries |
| `ledger` | Entries, allocations, balances |
| `documents` | Upload, metadata |
| `activity` | Timeline |
| `organizations` | Settings, membership |

**Rule:** UI list for daily work calls `declarations` module; dossier module serves job hub and money/documents aggregation.

## Declaration status FSM (MVP — import)

Hard-coded in `lib/domain/declaration-status.ts`:

```
draft → documents_pending → submitted → under_review
  → cleared → delivered → invoiced → closed
```

Guards example: `cleared` requires `customs_reference`.

**Do not** put customs FSM on `dossiers`.

## Transaction boundaries

Atomic operations:

- Create déclaration + dossier (if needed) + activity
- Transition declaration status + history + activity
- Payment + allocations + activity
- Reverse ledger entry + activity

## Authorization

Every query scoped by `organizationId`. Roles per [05-domain-model.md](./05-domain-model.md).

## Reporting (MVP)

- Client balance: ledger sum
- Dossier summary: charges/allocations by `dossier_id`
- Declaration list: join dossier + customer for table UI

## Evolution path

| Need | Change |
|------|--------|
| Export/transit FSM | Separate config per `dossier_type` |
| Groupage | `dossier_parties` |
| Allocate per déclaration | Extend allocations (phase 2) |
| OCR | Job on `document.uploaded` |
