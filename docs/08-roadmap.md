# Roadmap

Phases after the MVP demo defined in [03-mvp-scope.md](./03-mvp-scope.md).

---

## Phase 1 — MVP demo (current)

**Target:** 8–12 weeks for a small team, depending on pilot availability.

Deliverables: see MVP checklist in `03-mvp-scope`.

**Exit:** Pilot completes happy path; feedback list from 3+ desk sessions.

---

## Phase 2 — Pilot hardening

Focus: what the first real forwarder breaks.

| Item | Why |
|------|-----|
| Excel / opening balance import | Real onboarding |
| Export + transit declaration FSMs | Not only import |
| `dossier_parties` (importer, consignee) | Groupage |
| Allocation per déclaration (not only dossier) | Split money by filing |
| Invoicing PDF (agency invoice) | Billing desk |
| Task checklists per status | Replaces Notion checklists |
| Email notifications | Status / balance alerts |
| Role fine-tuning | Accountant vs operator friction |

---

## Phase 3 — Productization (B2B SaaS)

| Item | Why |
|------|-----|
| Stripe billing + plans | Revenue |
| Org self-signup + onboarding wizard | Scale |
| Custom fields (`jsonb` + field registry) | Per-company variance without workflow engine |
| Advanced search (Meilisearch or `tsvector`) | Volume |
| Reporting dashboard | Throughput, aging, débours |
| Inngest / Trigger.dev + OCR | Document extraction |
| Sentry + audit export | Enterprise trust |
| Staging / prod Neon branches | Safe releases |

---

## Phase 4 — Integrations & automation

| Item | Why |
|------|-----|
| Customs reference validation (manual → API) | Reduce errors |
| ASYCUDA / national system adapters | Country-specific |
| WhatsApp Business doc inbox | How docs actually arrive |
| Client portal (read-only dossier + solde) | Customer self-service |
| AI copilot (draft emails, summarize dossier) | Differentiator |

---

## Technical debt to watch

| Signal | Action |
|--------|--------|
| Balance bugs in production | Formalize sign rules; add integration tests |
| Prisma-like query sprawl | Keep services thin; extract views |
| Status logic in UI | Move all transitions to domain FSM |
| One org’s “special process” | Custom fields, not new code branches |
| Report queries slow OLTP | Read replica or materialized views |

---

## Open questions for anchor client

Ask early; answers reshape Phase 2 priority.

1. How is **solde** calculated today — what counts as débours vs honoraires?
2. Can one payment cover multiple dossiers? Partial allocations?
3. Exact status names they use on the desk (map to declaration FSM labels).
4. Do they already split **rectifications** as new rows in Notion Declarations?
5. Which **3 documents** are mandatory before customs submission?
6. Do they need **multi-currency** in year one?
7. Who is allowed to **reverse** a payment or charge?
8. What does the **relevé de compte** PDF must look like (columns, logo)?

Record answers in this folder as `docs/pilot-notes.md` when available.
