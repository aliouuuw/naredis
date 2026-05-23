import { and, eq } from "drizzle-orm";
import type { DbLike } from "@/lib/db";
import { customers } from "@/lib/db/schema";
import type { CustomerAccountStatus } from "@/lib/db/enums";
import { formatBalanceLabel } from "@/lib/domain/balance";
import { slugFromName } from "@/lib/utils/slug";
import { appendActivity } from "@/lib/modules/activity/append-activity";
import type { ModuleContext } from "@/lib/modules/shared/types";
import {
  getCustomerBalance,
  getCustomerDayOpenBalance,
  getCustomerDeclarationFeesAllTime,
  getCustomerTransactionsTodayTotal,
} from "./balance";
import type { CreateCustomerInput, UpdateCustomerInput } from "./schemas";

async function uniqueSlug(
  db: DbLike,
  organizationId: string,
  baseName: string,
  excludeId?: string,
): Promise<string> {
  let slug = slugFromName(baseName);
  let suffix = 0;

  while (true) {
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
    suffix += 1;
  }
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
  const rows = await db
    .select()
    .from(customers)
    .where(eq(customers.organizationId, ctx.organizationId))
    .orderBy(customers.name);

  return Promise.all(
    rows.map(async (row) => {
      const balance = await getCustomerBalance(
        db,
        ctx.organizationId,
        row.id,
      );
      const [feesAllTime, transactionsToday] = await Promise.all([
        getCustomerDeclarationFeesAllTime(db, ctx.organizationId, row.id),
        getCustomerTransactionsTodayTotal(db, ctx.organizationId, row.id),
      ]);

      return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        phone: row.phone,
        accountStatus: row.accountStatus,
        balanceAmount: balance.amount,
        balanceSide: balance.side,
        balanceLabel: formatBalanceLabel(balance.side),
        feesAllTime,
        transactionsToday,
      };
    }),
  );
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

  const [row] = await db
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

  await appendActivity(db, {
    organizationId: ctx.organizationId,
    entityType: "customer",
    entityId: row.id,
    action: "customer.created",
    payload: { name: row.name, slug: row.slug },
    actorId: ctx.userId,
  });

  return row;
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
