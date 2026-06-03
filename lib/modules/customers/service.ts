import { and, eq, sql } from "drizzle-orm";
import type { DbLike } from "@/lib/db";
import {
  customers,
  declarations,
  dossiers,
  ledgerEntries,
} from "@/lib/db/schema";
import type { CustomerAccountStatus } from "@/lib/db/enums";
import { balanceFromTotals, formatBalanceLabel } from "@/lib/domain/balance";
import { agencyCalendarDate } from "@/lib/domain/timezone";
import { slugFromName } from "@/lib/utils/slug";
import { appendActivity } from "@/lib/modules/activity/append-activity";
import type { ModuleContext } from "@/lib/modules/shared/types";
import {
  getCustomerBalance,
  getCustomerDayOpenBalance,
  getCustomerDeclarationFeesAllTime,
  getCustomerTransactionsTodayTotal,
} from "./balance";
// `getCustomerBalance` is kept for the fiche page; list uses inline aggregates.
void getCustomerBalance;
import { recordOpeningBalance } from "@/lib/modules/ledger/corrections";
import type { CreateCustomerInput, UpdateCustomerInput } from "./schemas";

async function uniqueSlug(
  db: DbLike,
  organizationId: string,
  baseName: string,
  excludeId?: string,
): Promise<string> {
  const slug = slugFromName(baseName);
  const MAX_ATTEMPTS = 1000;

  for (let suffix = 0; suffix < MAX_ATTEMPTS; suffix += 1) {
    const candidate = suffix === 0 ? slug : `${slug}-${suffix}`;
    const [existing] = await db
      .select({ id: customers.id })
      .from(customers)
      .where(
        and(
          eq(customers.organizationId, organizationId),
          eq(customers.slug, candidate),
        ),
      )
      .limit(1);

    if (!existing || existing.id === excludeId) {
      return candidate;
    }
  }

  throw new Error(
    `Impossible de générer un slug unique pour "${baseName}" après ${MAX_ATTEMPTS} tentatives`,
  );
}

export type CustomerListItem = {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  accountStatus: CustomerAccountStatus;
  balanceAmount: bigint;
  balanceSide: "debit" | "credit";
  balanceLabel: string;
  feesAllTime: bigint;
  transactionsToday: bigint;
};

export async function listCustomers(
  db: DbLike,
  ctx: ModuleContext,
): Promise<CustomerListItem[]> {
  const today = agencyCalendarDate();

  // One round-trip: customers ⨝ ledger aggregates ⨝ declaration fees ⨝ today's tx.
  const ledgerAgg = db
    .select({
      customerId: ledgerEntries.customerId,
      totalDebit: sql<string>`coalesce(sum(case when ${ledgerEntries.balanceSide} = 'debit' then ${ledgerEntries.amount} else 0 end), 0)`.as(
        "total_debit",
      ),
      totalCredit: sql<string>`coalesce(sum(case when ${ledgerEntries.balanceSide} = 'credit' then ${ledgerEntries.amount} else 0 end), 0)`.as(
        "total_credit",
      ),
      transactionsToday: sql<string>`coalesce(sum(case when ${ledgerEntries.effectiveDate} = ${today} then ${ledgerEntries.amount} else 0 end), 0)`.as(
        "transactions_today",
      ),
    })
    .from(ledgerEntries)
    .where(eq(ledgerEntries.organizationId, ctx.organizationId))
    .groupBy(ledgerEntries.customerId)
    .as("ledger_agg");

  const feesAgg = db
    .select({
      customerId: dossiers.customerId,
      feesAllTime: sql<string>`coalesce(sum(${declarations.costPrice}), 0)`.as(
        "fees_all_time",
      ),
    })
    .from(declarations)
    .innerJoin(dossiers, eq(declarations.dossierId, dossiers.id))
    .where(eq(declarations.organizationId, ctx.organizationId))
    .groupBy(dossiers.customerId)
    .as("fees_agg");

  const rows = await db
    .select({
      id: customers.id,
      name: customers.name,
      slug: customers.slug,
      phone: customers.phone,
      accountStatus: customers.accountStatus,
      totalDebit: ledgerAgg.totalDebit,
      totalCredit: ledgerAgg.totalCredit,
      transactionsToday: ledgerAgg.transactionsToday,
      feesAllTime: feesAgg.feesAllTime,
    })
    .from(customers)
    .leftJoin(ledgerAgg, eq(ledgerAgg.customerId, customers.id))
    .leftJoin(feesAgg, eq(feesAgg.customerId, customers.id))
    .where(eq(customers.organizationId, ctx.organizationId))
    .orderBy(customers.name);

  return rows.map((row) => {
    const balance = balanceFromTotals({
      totalDebit: BigInt(row.totalDebit ?? "0"),
      totalCredit: BigInt(row.totalCredit ?? "0"),
    });
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      phone: row.phone,
      accountStatus: row.accountStatus,
      balanceAmount: balance.amount,
      balanceSide: balance.side,
      balanceLabel: formatBalanceLabel(balance.side),
      feesAllTime: BigInt(row.feesAllTime ?? "0"),
      transactionsToday: BigInt(row.transactionsToday ?? "0"),
    };
  });
}

export async function getCustomerById(
  db: DbLike,
  ctx: ModuleContext,
  customerId: string,
) {
  const [row] = await db
    .select()
    .from(customers)
    .where(
      and(
        eq(customers.id, customerId),
        eq(customers.organizationId, ctx.organizationId),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function getCustomerFiche(
  db: DbLike,
  ctx: ModuleContext,
  customerId: string,
) {
  const customer = await getCustomerById(db, ctx, customerId);
  if (!customer) return null;

  const [balance, dayOpen, feesAllTime, transactionsToday] = await Promise.all([
    getCustomerBalance(db, ctx.organizationId, customerId),
    getCustomerDayOpenBalance(db, ctx.organizationId, customerId),
    getCustomerDeclarationFeesAllTime(db, ctx.organizationId, customerId),
    getCustomerTransactionsTodayTotal(db, ctx.organizationId, customerId),
  ]);

  return {
    customer,
    balance,
    dayOpenBalance: dayOpen,
    feesAllTime,
    transactionsToday,
  };
}

export async function createCustomer(
  db: DbLike,
  ctx: ModuleContext,
  input: CreateCustomerInput,
) {
  const slug = await uniqueSlug(db, ctx.organizationId, input.name);

  return db.transaction(async (tx) => {
    const [row] = await tx
      .insert(customers)
      .values({
        organizationId: ctx.organizationId,
        name: input.name.trim(),
        slug,
        phone: input.phone?.trim() || null,
        email: input.email?.trim() || null,
        taxId: input.taxId?.trim() || null,
        notes: input.notes?.trim() || null,
      })
      .returning();

    await appendActivity(tx, {
      organizationId: ctx.organizationId,
      entityType: "customer",
      entityId: row.id,
      action: "customer.created",
      payload: { name: row.name, slug: row.slug },
      actorId: ctx.userId,
    });

    if (
      input.openingBalanceAmount != null &&
      input.openingBalanceSide != null
    ) {
      await recordOpeningBalance(tx, ctx, {
        customerId: row.id,
        amount: input.openingBalanceAmount,
        balanceSide: input.openingBalanceSide,
        effectiveDate: input.openingBalanceDate,
      });
    }

    return row;
  });
}

export async function updateCustomer(
  db: DbLike,
  ctx: ModuleContext,
  customerId: string,
  input: UpdateCustomerInput,
) {
  const existing = await getCustomerById(db, ctx, customerId);
  if (!existing) return null;

  const name = input.name?.trim() ?? existing.name;
  const slug =
    input.name != null
      ? await uniqueSlug(db, ctx.organizationId, name, customerId)
      : existing.slug;

  const [row] = await db
    .update(customers)
    .set({
      name,
      slug,
      phone:
        input.phone !== undefined ? input.phone?.trim() || null : existing.phone,
      email:
        input.email !== undefined ? input.email?.trim() || null : existing.email,
      taxId:
        input.taxId !== undefined ? input.taxId?.trim() || null : existing.taxId,
      notes:
        input.notes !== undefined ? input.notes?.trim() || null : existing.notes,
      accountStatus: input.accountStatus ?? existing.accountStatus,
      isActive: input.isActive ?? existing.isActive,
    })
    .where(
      and(
        eq(customers.id, customerId),
        eq(customers.organizationId, ctx.organizationId),
      ),
    )
    .returning();

  if (row) {
    await appendActivity(db, {
      organizationId: ctx.organizationId,
      entityType: "customer",
      entityId: customerId,
      action: "customer.updated",
      payload: { fields: Object.keys(input) },
      actorId: ctx.userId,
    });
  }

  return row ?? null;
}
