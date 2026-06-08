import type {
  CarteLedgerDeclarationRow,
  CarteLedgerDebitTypeRow,
  CarteLedgerSnapshot,
  CarteLedgerZoneRow,
  GaindeCardDebitRow,
  GaindeCardLoadRow,
} from "./service";

export type GaindeCardLoadSerialized = Omit<
  GaindeCardLoadRow,
  "amount" | "createdAt"
> & {
  amount: string;
  createdAt: string;
};

export type GaindeCardDebitSerialized = Omit<
  GaindeCardDebitRow,
  "amount" | "createdAt"
> & {
  amount: string;
  createdAt: string;
};

export type CarteLedgerDeclarationSerialized = Omit<
  CarteLedgerDeclarationRow,
  "gaindeDutyAmount" | "clientAmountPaid"
> & {
  gaindeDutyAmount: string | null;
  clientAmountPaid: string | null;
};

export type CarteLedgerZoneRowSerialized = Omit<
  CarteLedgerZoneRow,
  "totalGainde" | "declarations"
> & {
  totalGainde: string;
  declarations: CarteLedgerDeclarationSerialized[];
};

export type CarteLedgerDebitTypeRowSerialized = Omit<
  CarteLedgerDebitTypeRow,
  "total" | "entries"
> & {
  total: string;
  entries: GaindeCardDebitSerialized[];
};

export type CarteLedgerSnapshotSerialized = Omit<
  CarteLedgerSnapshot,
  | "loads"
  | "totalPayments"
  | "zoneRows"
  | "totalDeclarationDebits"
  | "debitTypeRows"
  | "totalManualDebits"
  | "totalDebits"
  | "totalPaymentsCumulative"
  | "totalDeclarationDebitsCumulative"
  | "totalManualDebitsCumulative"
  | "totalDebitsCumulative"
  | "balanceRemaining"
> & {
  loads: GaindeCardLoadSerialized[];
  totalPayments: string;
  zoneRows: CarteLedgerZoneRowSerialized[];
  totalDeclarationDebits: string;
  debitTypeRows: CarteLedgerDebitTypeRowSerialized[];
  totalManualDebits: string;
  totalDebits: string;
  totalPaymentsCumulative: string;
  totalDeclarationDebitsCumulative: string;
  totalManualDebitsCumulative: string;
  totalDebitsCumulative: string;
  balanceRemaining: string;
  /** @deprecated use totalPayments */
  totalLoaded: string;
  /** @deprecated use totalDeclarationDebits */
  totalGainde: string;
  /** @deprecated use totalPaymentsCumulative */
  totalLoadedCumulative: string;
  /** @deprecated use totalDeclarationDebitsCumulative */
  totalGaindeCumulative: string;
};

function serializeLoad(row: GaindeCardLoadRow): GaindeCardLoadSerialized {
  return {
    ...row,
    amount: row.amount.toString(),
    createdAt: row.createdAt.toISOString(),
  };
}

function serializeDebit(row: GaindeCardDebitRow): GaindeCardDebitSerialized {
  return {
    ...row,
    amount: row.amount.toString(),
    createdAt: row.createdAt.toISOString(),
  };
}

function serializeDeclaration(
  row: CarteLedgerDeclarationRow,
): CarteLedgerDeclarationSerialized {
  return {
    ...row,
    gaindeDutyAmount: row.gaindeDutyAmount?.toString() ?? null,
    clientAmountPaid: row.clientAmountPaid?.toString() ?? null,
  };
}

export function serializeCarteLedgerSnapshot(
  snapshot: CarteLedgerSnapshot,
): CarteLedgerSnapshotSerialized {
  const totalPayments = snapshot.totalPayments.toString();
  const totalDeclarationDebits = snapshot.totalDeclarationDebits.toString();

  return {
    ...snapshot,
    loads: snapshot.loads.map(serializeLoad),
    totalPayments,
    totalDeclarationDebits,
    debitTypeRows: snapshot.debitTypeRows.map((row) => ({
      ...row,
      total: row.total.toString(),
      entries: row.entries.map(serializeDebit),
    })),
    totalManualDebits: snapshot.totalManualDebits.toString(),
    totalDebits: snapshot.totalDebits.toString(),
    totalPaymentsCumulative: snapshot.totalPaymentsCumulative.toString(),
    totalDeclarationDebitsCumulative:
      snapshot.totalDeclarationDebitsCumulative.toString(),
    totalManualDebitsCumulative:
      snapshot.totalManualDebitsCumulative.toString(),
    totalDebitsCumulative: snapshot.totalDebitsCumulative.toString(),
    balanceRemaining: snapshot.balanceRemaining.toString(),
    zoneRows: snapshot.zoneRows.map((z) => ({
      ...z,
      totalGainde: z.totalGainde.toString(),
      declarations: z.declarations.map(serializeDeclaration),
    })),
    totalLoaded: totalPayments,
    totalGainde: totalDeclarationDebits,
    totalLoadedCumulative: snapshot.totalPaymentsCumulative.toString(),
    totalGaindeCumulative: snapshot.totalDeclarationDebitsCumulative.toString(),
  };
}
