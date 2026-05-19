# Information architecture — pages & layout

See **[00-glossary.md](./00-glossary.md)**. **UI = Déclarations** (Notion). **Code = dossiers + declarations**.

---

## Site map

```
/login

/app
├── /declarations              ← default landing (Notion "Declarations" DB)
│   ├── /declarations/new
│   └── /declarations/[id]     ← fiche déclaration (daily work)
├── /dossiers/[id]             ← job hub (multi-filing, docs, money)
├── /clients
│   ├── /clients/new
│   └── /clients/[id]
├── /dashboard
└── /settings
```

**Default after login:** `/declarations`

---

## App shell

```
┌──────────────────────────────────────────────────────────────────┐
│ [Logo]              [ 🔍 Rechercher...  ⌘K ]           [User ▾]  │
├────────────┬─────────────────────────────────────────────────────┤
│ Tableau de │                                                     │
│ bord       │   Main content                                      │
│            │                                                     │
│ Déclarat. ●│                                                     │
│            │                                                     │
│ Clients    │                                                     │
│            │                                                     │
│ Réglages   │                                                     │
│            │                                                     │
│[+ Déclar.] │                                                     │
└────────────┴─────────────────────────────────────────────────────┘
```

| Zone | Behavior |
|------|----------|
| Primary nav label | **Déclarations** (not "Dossiers") |
| Primary CTA | **+ Nouvelle déclaration** |
| Secondary entry | Dossier reachable via link on fiche / column |

---

## Page: Liste des déclarations (`/declarations`)

**Notion analog:** the **Declarations** table.

```
Déclarations                         [ + Nouvelle déclaration ]

[ Tous ] [ En cours ] [ Docs manquants ] [ À facturer ] [ Clôturées ]

[ 🔍 ]  Client ▾  Statut ▾  Type dossier ▾        Tri: Mis à jour ▾

┌──────────┬──────────┬────────────┬────────────┬──────────┬──────────┐
│ N° décl. │ Dossier  │ Client     │ Statut     │ N° douane│ BL       │
├──────────┼──────────┼────────────┼────────────┼──────────┼──────────┤
│ DEC-0042 │ 2025-018 │ ACME SARL  │ En vérif.  │ —        │ MSKU…    │
│ DEC-0043 │ 2025-018 │ ACME SARL  │ Brouillon  │ —        │ MSKU…    │  ← rectif.
└──────────┴──────────┴────────────┴────────────┴──────────┴──────────┘
```

- Row click → `/declarations/[id]`
- Same dossier number on two rows = two filings for one job (expected)
- Empty state: « Créez votre première déclaration »

---

## Page: Fiche déclaration (`/declarations/[id]`)

**Notion analog:** opening one declaration row as a page.  
**Customs work happens here** — status stepper, douane fields.

```
← Déclarations    DEC-0042 · Rectificative          [ ⋯ ]

Dossier 2025-018 (lien)  ·  Client ACME SARL  ·  Import

┌─ Statut douane (stepper) ─────────────────────────────────────────┐
│  Brouillon → Docs → Déposée → … → Clôturée                          │
└────────────────────────────────────────────────────────────────────┘

┌─ Propriétés déclaration ───────────────────────────────────────────┐
│ Type              Rectification   │ Statut      En vérification   │
│ N° douane         (manquant ⚠)    │ Bureau      Dakar Port        │
│ Régime            —               │ Ouverte le  12 mars 2025      │
└───────────────────────────────────────────────────────────────────┘

┌─ Infos dossier (read-mostly / lien "Modifier le dossier") ─────────┐
│ BL / AWB MSKU1234567  │ Conteneur —  │ Solde dossier  450 000 XOF │
└───────────────────────────────────────────────────────────────────┘

[ Résumé ] [ Activité ]     ← déclaration-focused tabs

── Optional shortcut links ──
   Voir documents et finances du dossier →  /dossiers/[dossierId]
```

### Tab: Résumé

- Note / description for this filing
- Blocker alerts (missing n° douane, etc.)
- If dossier has **multiple déclarations**: mini-table + « Ajouter une déclaration (rectificative) »

### Tab: Activité

- Timeline for this declaration (+ rolled-up dossier events optional filter)

### Status change

Sheet: allowed next statuses only; note field; writes `declaration_status_history`.

### Header actions (`⋯`)

| Action | Notes |
|--------|-------|
| Changer le statut | FSM |
| Ajouter déclaration rectificative | Same dossier, new row |
| Ouvrir le dossier | → `/dossiers/[id]` |
| Voir le client | → `/clients/[id]` |

---

## Page: Fiche dossier (`/dossiers/[id]`)

**When:** multiple déclarations, documents, job-level money, case close.

```
← Dossier 2025-018 · Import MSKU1234567          [ ⋯ Clôturer le dossier ]

Client ACME SARL    ·  Statut dossier: Ouvert

[ Déclarations ] [ Documents ] [ Finances ] [ Activité ]

── Déclarations tab ──
┌──────────┬──────────────┬────────────┬──────────┐
│ N° décl. │ Type         │ Statut     │ N° douane│
├──────────┼──────────────┼────────────┼──────────┤
│ DEC-0041 │ Initiale     │ Clôturée   │ 12345    │
│ DEC-0042 │ Rectification│ En vérif.  │ —        │
└──────────┴──────────────┴────────────┴──────────┘
[ + Ajouter une déclaration ]

── Documents tab ── (job-level; optional link per filing)

── Finances tab ── (charges, dossier solde summary, allocations)

── Activité tab ── (all events for job)
```

---

## Page: Nouvelle déclaration (`/declarations/new`)

**Notion analog:** new row in Declarations.

```
Client*          [ ACME SARL        ▾ ]
Dossier          ( ) Nouveau dossier   ← default
                 ( ) Dossier existant [ 2025-018 ▾ ]  ← shows if client has open jobs

Type dossier     Import | Export | Transit
Type déclaration Initiale | Rectificative  (if existing dossier → default Rectificative)

BL / AWB         optional (on dossier)
Titre            optional

[ Créer ]
→ /declarations/[id]  + toast « Déclaration DEC-0044 créée »
```

**System:** always ensures a `dossier_id`; creates dossier when "Nouveau dossier".

---

## Page: Clients

Unchanged pattern; client fiche tabs:

| Tab | Content |
|-----|---------|
| **Déclarations** | All declarations for client (Notion rollup) |
| **Dossiers** | Optional grouped view by job |
| **Comptabilité** | Ledger, payments, relevé PDF |
| **Activité** | Client-level log |

---

## Page: Dashboard

| Card | Metric |
|------|--------|
| Déclarations en cours | count |
| Par statut | breakdown |
| Dossiers ouverts | count |
| Soldes clients | top balances |

---

## Global search (`⌘K`)

```
Déclarations
  DEC-0042 · Rectificative · ACME
Dossiers
  2025-018 · MSKU1234567
Clients
  ACME SARL
Actions
  + Nouvelle déclaration
```

---

## Modals catalog

| ID | Purpose |
|----|---------|
| `status-change` | Declaration FSM |
| `new-declaration` | Quick create (optional) |
| `add-declaration-to-dossier` | Rectification |
| `upload-document` | On dossier |
| `add-charge` | Dossier (+ optional déclaration) |
| `record-payment` / `allocate` | Client comptabilité |
| `reverse-entry` | Ledger |
| `close-dossier` | Case status |

---

## Master–detail (phase 1.1 UX enhancement)

On wide screens, optional split:

```
| Liste déclarations | Fiche déclaration (selected row) |
```

Same routes; layout variant on `/declarations`. Not required for first MVP slice.

---

## Role visibility

| Action | Operator | Accountant |
|--------|----------|------------|
| Change declaration status | ✓ | ✓ |
| Add rectificative | ✓ | ✓ |
| Upload documents (dossier) | ✓ | ✓ |
| Charges / payments | read / ✗ | ✓ |
| Close dossier | ✗ | admin+ |

---

## Responsive

Mobile bottom nav: **Déclarations**, **Clients**, **Recherche**.
