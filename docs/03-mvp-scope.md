# MVP scope

## Goal

Ship a **credible demo** for the pilot forwarder: replace Notion **Clients**, **Declarations**, and **Transactions** — aligned with [13-pilot-operations.md](./13-pilot-operations.md).

---

## In scope

### Platform

- [ ] `organization_id` on all business rows
- [ ] Better Auth + org membership + roles
- [ ] Drizzle + migrations (PG 17 local; Neon later)
- [ ] App-layer tenancy on every query

### Customers

- [ ] CRUD with **slug** from name
- [ ] Manual **à jour / pas à jour** (`account_status`)
- [ ] List: computed **solde** (débit/crédit), all-time dossier fees, **transactions today** (Dakar)
- [ ] **Report** at day open: **computed view** (not a ledger row)
- [ ] Opening balance as ledger `opening_balance` with `balance_side`

### Organization agencies (maison-mère)

- [ ] CRUD `organization_agencies` in settings (configurable names)

### Dossiers

- [ ] Job folder: client, BL, `case_status`, dossier number
- [ ] MVP: 1 dossier created with each new déclaration (1 BL)

### Déclarations (primary UI — one row per BL)

- [ ] Zone/terminal, declaration date, container count + **container numbers**
- [ ] **Montant** (`client_amount_paid`), **GAINDE** (`gainde_duty_amount`), **prix de revient** (`cost_price`)
- [ ] **Paying agency** (optional FK)
- [ ] **Bon à délivrer** checkbox (all required fields filled first)
- [ ] **Rectificative:** edit row + `declaration_edit_log` (not second row)
- [ ] List `/declarations` with client, BL, zone, bon à délivrer
- [ ] Fiche `/declarations/[id]`
- [ ] Customs FSM — **optional / secondary** for pilot (can defer UI)

### Ledger (Transactions)

- [ ] Immutable entries; **`balance_side`** débit/crédit; positive `amount`
- [ ] Types: **`versement`** (credit), `charge` (debit), `opening_balance`, `reversal`
- [ ] **Multi-dossier** `payment_allocations`
- [ ] `notes` on entries
- [ ] No stored signed solde; no `report` entry type

### Documents / Activity

- [ ] Documents on dossier; activity on edits, ledger, declarations

### UI / exports

- [x] Tab nav shell, dashboard landing, theme (`UI-004`, `UI-005`)
- [x] Excel relevé de compte (`.xlsx` from client fiche)
- [ ] Global search (BL, client, declaration #)

### Developer experience

- [ ] Seed aligned with pilot fields
- [ ] Zod on server boundaries

---

## Out of scope (defer)

| Feature | Defer to |
|---------|----------|
| ASYCUDA / GAINDE API integration | Phase 4+ |
| Full customs FSM as primary workflow | Until pilot asks |
| Second declaration row for rectificative | Replaced by edit+log |
| Stored “report” transaction rows | Never — computed only |
| Fixed enum for agency names | Use `organization_agencies` |
| OCR, WhatsApp, client portal | Later phases |

---

## Definition of done

- [ ] Pilot completes happy path in **déclaration** language (BL row + bon à délivrer)
- [ ] Rectificative via **edit + audit log**
- [ ] Solde matches ledger using **débit/crédit** rules
- [ ] Day-open **report** matches computed balance
- [ ] Versement with multi-dossier allocation works
- [ ] Agencies configurable in settings
