# Overview

## Problem

Small and mid-sized freight forwarders and customs brokers in Senegal (and UEMOA more broadly) run operations across fragmented tools:

- **Notion** — case notes and lightweight databases (**Clients**, **Declarations**, **Transactions**)
- **Excel** — balances, tracking, ad-hoc reports
- **WhatsApp** — coordination and document sharing
- **PDFs / scans** — customs and commercial documents
- **Manual accounting** — client balances (“solde”), advances, reimbursements

There is no single system of record for **jobs (dossiers)**, **customs filings (déclarations)**, **money**, and **documents** together.

## Product thesis

Build an **operational case management + client subledger** platform:

- **Dossier** = shipment file / job (container for one client operation).
- **Déclaration** = customs filing inside that job (status pipeline, customs refs) — **may be several per dossier** (e.g. rectification).
- **UI speaks “Déclarations”** for the main list (Notion habit); **dossier** surfaces as the parent job when needed.
- **Ledger entries** are immutable financial facts; **client balance is derived**, never edited directly.
- **Documents** attach primarily to the dossier; some types may link to a specific déclaration.
- **Activity timeline** gives operational visibility and audit without full event sourcing.

See **[00-glossary.md](./00-glossary.md)** for dossier vs déclaration.

## Target users (MVP)

| Role | Needs |
|------|--------|
| Operations clerk | Create déclarations, update customs status, attach documents |
| Declarant / customs desk | Track déclaration stages, references, blockers |
| Accountant / admin | Record charges and payments, client statements, allocations |
| Owner / manager | Dashboard: open work, overdue balances |

## Core vocabulary (French → code)

| Term (UI) | Code / meaning |
|-----------|----------------|
| **Client** | `customer` — account with subledger |
| **Déclaration** | `declaration` — customs filing (main Notion-like table) |
| **Dossier** | `dossier` — job / shipment file (parent of déclarations) |
| **Solde** | computed from ledger |
| **Écriture / Transaction** | `ledger_entry` |
| **Débours** | charge category |
| **Honoraires** | charge category |
| **Relevé de compte** | PDF export |

## Reference workflow (happy path)

```
Client account
  → Nouvelle déclaration (creates dossier + first filing)
  → Documents on dossier
  → Advance déclaration status (customs pipeline)
  → Charges on dossier (optional link to déclaration)
  → Client payment + allocation to dossier
  → Close déclaration / dossier
  → Relevé de compte
```

## Senegal customs context (informative)

Each **déclaration** typically moves through stages such as:

`brouillon → déposée → en vérification → liquidée → OED délivrée → marchandises retirées`

Systems in the ecosystem include **SYDONIA**, **GAINDE**, **ORBUS2**. MVP does **not** integrate with these — we model stages and reference numbers so desk language matches the UI.

## Success criteria for MVP demo

A forwarder can:

1. Log in under their **organization**.
2. Create a **client** with optional opening balance.
3. Create a **déclaration** (with dossier), upload documents, advance customs status.
4. Add a **second déclaration** on the same dossier (rectification scenario).
5. Post **charges** and a **payment**, allocate to dossier.
6. See **client solde** and **dossier financial summary**.
7. Export a simple **relevé de compte** PDF.

Replacing one week of Notion + Excel hunting for a single pilot customer = validation.

## Non-goals (MVP)

- ASYCUDA / port / carrier integrations
- OCR / AI copilot
- WhatsApp integration
- Configurable per-company workflow designer
- Full double-entry general ledger
- Offline-first mobile
- Multi-currency beyond storing `currency` on rows
