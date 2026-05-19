# UI component patterns

See **[00-glossary.md](./00-glossary.md)** and [10-information-architecture.md](./10-information-architecture.md).

---

## Shell

| Component | Notes |
|-----------|-------|
| `AppSidebar` | Nav: **Déclarations**, Clients; CTA **+ Nouvelle déclaration** |
| `CommandMenu` | Search declarations, dossiers, clients |

---

## Declarations (primary)

| Component | Use |
|-----------|-----|
| `DeclarationsTable` | Main list with dossier + client columns |
| `DeclarationHeader` | DEC #, kind badge, dossier link |
| `DeclarationStatusStepper` | Customs FSM |
| `DeclarationPropertyGrid` | n° douane, bureau, régime |
| `DossierContextCard` | BL, container, solde dossier on fiche |
| `DeclarationsOnDossierTable` | Dossier tab — multiple filings |
| `AddDeclarationButton` | Rectificative |

---

## Dossiers (job hub)

| Component | Use |
|-----------|-----|
| `DossierHeader` | Dossier #, case_status, close action |
| `DossierTabs` | Déclarations, Documents, Finances, Activité |
| `CaseStatusBadge` | Ouvert / En suspens / Clôturé |

---

## Shared

| Component | Use |
|-----------|-----|
| `StatusBadge` | Declaration customs status |
| `KindBadge` | Initiale / Rectificative |
| `MoneyDisplay` | XOF |
| `LinkedRecord` | Client, dossier links |
| `ActivityTimeline` | Per entity |
| `FinanceSummary` | On dossier tab |

---

## Forms

| Component | Use |
|-----------|-----|
| `NewDeclarationForm` | Client + new/existing dossier + kind |
| `StatusChangeSheet` | Declaration FSM |
| `ChargeFormDialog` | dossier_id + optional declaration_id |
| `PaymentFormDialog` / `AllocationEditor` | Unchanged |

---

## Implementation folders

```
components/
  shell/
  declarations/    ← primary
  dossiers/        ← job hub
  clients/
  finance/
  documents/
  activity/
  shared/
```

Cross-link domain FSM: `lib/domain/declaration-status.ts` (not `dossier-status.ts`).
