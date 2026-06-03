import type { BalanceSide } from "@/lib/db/enums";

export type BalanceTotals = {
  totalDebit: bigint;
  totalCredit: bigint;
};

export type CustomerBalance = {
  amount: bigint;
  side: BalanceSide;
};

/** Agency view: net client debt = debits − credits. */
export function balanceFromTotals({
  totalDebit,
  totalCredit,
}: BalanceTotals): CustomerBalance {
  const net = totalDebit - totalCredit;
  const zero = BigInt(0);
  if (net > zero) {
    return { amount: net, side: "debit" };
  }
  if (net < zero) {
    return { amount: -net, side: "credit" };
  }
  return { amount: zero, side: "debit" };
}

export function formatBalanceLabel(side: BalanceSide): "Débit" | "Crédit" {
  return side === "debit" ? "Débit" : "Crédit";
}

/** Human label for solde side; zero net is équilibré (not “débit”). */
export function describeBalanceSide(balance: CustomerBalance): string {
  if (balance.amount === BigInt(0)) return "Équilibré";
  return formatBalanceLabel(balance.side);
}

/** Statement-style solde: `1 234 567 XOF · Crédit`. */
export function formatBalanceStatement(balance: CustomerBalance): string {
  if (balance.amount === BigInt(0)) {
    return `${formatXof(BigInt(0))} XOF · Équilibré`;
  }
  const short = balance.side === "debit" ? "Débit" : "Crédit";
  return `${formatXof(balance.amount)} XOF · ${short}`;
}

/** Format XOF whole francs for UI (French grouping). */
export function formatXof(amount: bigint): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "decimal",
    maximumFractionDigits: 0,
  }).format(amount);
}
