import type { TableColumnDef } from "./table-columns";

export const DECLARATION_LIST_TABLE_ID = "declarations";

export const DECLARATION_LIST_COLUMNS: TableColumnDef[] = [
  { id: "number", label: "N° décl.", required: true },
  { id: "client", label: "Client" },
  { id: "dossier", label: "Dossier" },
  { id: "bl", label: "BL" },
  { id: "zone", label: "Zone" },
  { id: "date", label: "Date" },
  { id: "containerCount", label: "Nb conteneurs", defaultHidden: true },
  {
    id: "containers",
    label: "N° conteneurs",
    defaultHidden: true,
  },
  { id: "amount", label: "Montant client" },
  { id: "gainde", label: "GAINDE", defaultHidden: true },
  { id: "cost", label: "Prix de revient", defaultHidden: true },
  { id: "reste", label: "Reste" },
  { id: "agency", label: "Maison-mère", defaultHidden: true },
  { id: "bad", label: "BAD" },
  { id: "actions", label: "Actions", pinnedEnd: true, required: true },
];

export const CLIENT_LIST_TABLE_ID = "clients";

export const CLIENT_LIST_COLUMNS: TableColumnDef[] = [
  { id: "name", label: "Client", required: true },
  { id: "phone", label: "Téléphone" },
  { id: "balance", label: "Solde" },
  { id: "fees", label: "Frais dossiers" },
  { id: "transactionsToday", label: "Transactions jour" },
  { id: "status", label: "Statut" },
  { id: "actions", label: "Actions", pinnedEnd: true, required: true },
];

export const TRANSACTION_LIST_TABLE_ID = "transactions";

export const TRANSACTION_LIST_COLUMNS: TableColumnDef[] = [
  { id: "date", label: "Date", required: true },
  { id: "customer", label: "Client" },
  { id: "label", label: "Libellé", required: true },
  { id: "links", label: "Liens" },
  { id: "debit", label: "Débit" },
  { id: "credit", label: "Crédit" },
];

export type DeclarationListColumnId =
  (typeof DECLARATION_LIST_COLUMNS)[number]["id"];
export type ClientListColumnId = (typeof CLIENT_LIST_COLUMNS)[number]["id"];
export type TransactionListColumnId =
  (typeof TRANSACTION_LIST_COLUMNS)[number]["id"];
