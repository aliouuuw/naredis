import {
  balanceFromTotals,
  describeBalanceSide,
  formatXof,
  type CustomerBalance,
} from "@/lib/domain/balance";
import { computeDeclarationReste } from "@/lib/domain/declaration-reste";
import type { BalanceSide } from "@/lib/db/enums";
import type { DeclarationListItemSerialized } from "@/lib/modules/declarations/serialize-list";
import type { LedgerEntrySerialized } from "@/lib/modules/ledger/serialize";

export type AccountLedgerRow = {
  id: string;
  kind: "ledger" | "declaration";
  occurredAt: string;
  dayKey: string;
  /** dd/MM/yyyy for statement column */
  dateDisplay: string;
  label: string;
  detail: string | null;
  debitDisplay: string | null;
  creditDisplay: string | null;
  href: string;
  affectsBalance: boolean;
  runningBalance: { amount: string; side: BalanceSide };
};

export type AccountLedgerDayGroup = {
  dayKey: string;
  dayLabel: string;
  rows: AccountLedgerRow[];
};

type TimelineEvent = {
  id: string;
  kind: "ledger" | "declaration";
  occurredAt: Date;
  dayKey: string;
  label: string;
  detail: string | null;
  href: string;
  affectsBalance: boolean;
  debit: bigint;
  credit: bigint;
};

function formatStatementDate(dayKey: string): string {
  const [y, m, d] = dayKey.split("-");
  return `${d}/${m}/${y}`;
}

function formatDayLabel(dayKey: string): string {
  const [y, m, d] = dayKey.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function serializeBalance(b: CustomerBalance): {
  amount: string;
  side: BalanceSide;
} {
  return { amount: b.amount.toString(), side: b.side };
}

function ledgerEvents(rows: LedgerEntrySerialized[]): TimelineEvent[] {
  return rows.map((row) => {
    const debit = row.balanceSide === "debit" ? BigInt(row.amount) : BigInt(0);
    const credit =
      row.balanceSide === "credit" ? BigInt(row.amount) : BigInt(0);
    const at = new Date(`${row.effectiveDate}T12:00:00.000Z`);
    return {
      id: `ledger-${row.id}`,
      kind: "ledger",
      occurredAt: at,
      dayKey: row.effectiveDate,
      label: row.label,
      detail: row.transactionTypeName,
      href: `/clients/${row.customerId}?tab=transactions`,
      affectsBalance: true,
      debit,
      credit,
    };
  });
}

function declarationEvents(
  rows: DeclarationListItemSerialized[],
): TimelineEvent[] {
  return rows.map((row) => {
    const date =
      row.declarationDate ??
      (row.createdAt ? row.createdAt.slice(0, 10) : null) ??
      "1970-01-01";
    const at = new Date(`${date}T12:00:00.000Z`);
    const montant =
      row.clientAmountPaid != null
        ? formatXof(BigInt(row.clientAmountPaid))
        : null;
    const reste =
      row.clientAmountPaid != null && row.costPrice != null
        ? computeDeclarationReste(
            BigInt(row.clientAmountPaid),
            BigInt(row.costPrice),
          )
        : null;
    const parts = [
      row.blReference ? `BL ${row.blReference}` : null,
      montant != null ? `Montant ${montant} XOF` : null,
      reste != null ? `Reste ${formatXof(reste)} XOF` : null,
      row.bonADelivrer ? "BAD" : null,
    ].filter(Boolean);

    return {
      id: `declaration-${row.id}`,
      kind: "declaration",
      occurredAt: at,
      dayKey: date,
      label: row.declarationNumber,
      detail: parts.join(" · ") || "Déclaration",
      href: `/declarations?open=${row.id}`,
      affectsBalance: false,
      debit: BigInt(0),
      credit: BigInt(0),
    };
  });
}

export function buildAccountLedger(
  ledgerEntries: LedgerEntrySerialized[],
  declarations: DeclarationListItemSerialized[],
): AccountLedgerDayGroup[] {
  const events = [
    ...ledgerEvents(ledgerEntries),
    ...declarationEvents(declarations),
  ].sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());

  let totalDebit = BigInt(0);
  let totalCredit = BigInt(0);

  const withBalance: AccountLedgerRow[] = events.map((ev) => {
    if (ev.affectsBalance) {
      totalDebit += ev.debit;
      totalCredit += ev.credit;
    }
    const running = balanceFromTotals({ totalDebit, totalCredit });
    const debitDisplay =
      ev.debit > BigInt(0) ? formatXof(ev.debit) : null;
    const creditDisplay =
      ev.credit > BigInt(0) ? formatXof(ev.credit) : null;
    return {
      id: ev.id,
      kind: ev.kind,
      occurredAt: ev.occurredAt.toISOString(),
      dayKey: ev.dayKey,
      dateDisplay: formatStatementDate(ev.dayKey),
      label: ev.label,
      detail: ev.detail,
      debitDisplay,
      creditDisplay,
      href: ev.href,
      affectsBalance: ev.affectsBalance,
      runningBalance: serializeBalance(running),
    };
  });

  const byDay = new Map<string, AccountLedgerRow[]>();
  for (const row of withBalance) {
    const list = byDay.get(row.dayKey) ?? [];
    list.push(row);
    byDay.set(row.dayKey, list);
  }

  const dayKeys = [...byDay.keys()].sort((a, b) => b.localeCompare(a));

  return dayKeys.map((dayKey) => {
    const rows = (byDay.get(dayKey) ?? []).slice().reverse();
    return {
      dayKey,
      dayLabel: formatDayLabel(dayKey),
      rows,
    };
  });
}

export function formatRunningBalanceLabel(row: AccountLedgerRow): string {
  const balance: CustomerBalance = {
    amount: BigInt(row.runningBalance.amount),
    side: row.runningBalance.side,
  };
  return describeBalanceSide(balance) === "Équilibré"
    ? "—"
    : `${formatXof(balance.amount)} · ${describeBalanceSide(balance)}`;
}
