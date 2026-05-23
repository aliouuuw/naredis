import { and, eq, lt, sql } from "drizzle-orm";
import type { DbLike } from "@/lib/db";
import {
  customers,
  declarations,
  dossiers,
  ledgerEntries,
} from "@/lib/db/schema";
import {
  balanceFromTotals,
  type BalanceTotals,
  type CustomerBalance,
} from "@/lib/domain/balance";
import { agencyCalendarDate } from "@/lib/domain/timezone";

export async function getLedgerTotalsForCustomer(
  db: DbLike,
  organizationId: string,
  customerId: string,
  options?: { beforeEffectiveDate?: string },
): Promise<BalanceTotals> {
  const conditions = [
    eq(ledgerEntries.organizationId, organizationId),
    eq(ledgerEntries.customerId, customerId),
  ];

  if (options?.beforeEffectiveDate) {
    conditions.push(
      lt(ledgerEntries.effectiveDate, options.beforeEffectiveDate),
    );
  }

  const [row] = await db
    .select({
      totalDebit: sql<string>`coalesce(sum(case when ${ledgerEntries.balanceSide} = 'debit' then ${ledgerEntries.amount} else 0 end), 0)`,
      totalCredit: sql<string>`coalesce(sum(case when ${ledgerEntries.balanceSide} = 'credit' then ${ledgerEntries.amount} else 0 end), 0)`,
    })
    .from(ledgerEntries)
    .where(and(...conditions));

  return {
    totalDebit: BigInt(row?.totalDebit ?? "0"),
    totalCredit: BigInt(row?.totalCredit ?? "0"),
  };
}

export async function getCustomerBalance(
  db: DbLike,
  organizationId: string,
  customerId: string,
): Promise<CustomerBalance> {
  const totals = await getLedgerTotalsForCustomer(
    db,
    organizationId,
    customerId,
  );
  return balanceFromTotals(totals);
}

/** Report: net solde at start of today (entries before today's date in Dakar). */
export async function getCustomerDayOpenBalance(
  db: DbLike,
  organizationId: string,
  customerId: string,
  date: string = agencyCalendarDate(),
): Promise<CustomerBalance> {
  const totals = await getLedgerTotalsForCustomer(db, organizationId, customerId, {
    beforeEffectiveDate: date,
  });
  return balanceFromTotals(totals);
}

export async function getCustomerTransactionsTodayTotal(
  db: DbLike,
  organizationId: string,
  customerId: string,
  date: string = agencyCalendarDate(),
): Promise<bigint> {
  const [row] = await db
    .select({
      total: sql<string>`coalesce(sum(${ledgerEntries.amount}), 0)`,
    })
    .from(ledgerEntries)
    .where(
      and(
        eq(ledgerEntries.organizationId, organizationId),
        eq(ledgerEntries.customerId, customerId),
        eq(ledgerEntries.effectiveDate, date),
      ),
    );

  return BigInt(row?.total ?? "0");
}

export async function getCustomerDeclarationFeesAllTime(
  db: DbLike,
  organizationId: string,
  customerId: string,
): Promise<bigint> {
  const [row] = await db
    .select({
      total: sql<string>`coalesce(sum(${declarations.costPrice}), 0)`,
    })
    .from(declarations)
    .innerJoin(dossiers, eq(declarations.dossierId, dossiers.id))
    .where(
      and(
        eq(declarations.organizationId, organizationId),
        eq(dossiers.customerId, customerId),
      ),
    );

  return BigInt(row?.total ?? "0");
}
