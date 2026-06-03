import {
  and,
  desc,
  eq,
  exists,
  gte,
  ilike,
  inArray,
  isNotNull,
  isNull,
  lte,
  not,
  or,
  sql,
} from "drizzle-orm";
import type { DbLike } from "@/lib/db";
import type { BalanceSide } from "@/lib/db/enums";
import {
  customers,
  declarations,
  dossiers,
  ledgerEntries,
  ledgerTransactionTypes,
  paymentAllocations,
} from "@/lib/db/schema";
import { appendActivity } from "@/lib/modules/activity/append-activity";
import {
  assertCustomerInOrg,
  assertDeclarationInOrgForCustomer,
  assertDossierInOrgForCustomer,
  OrgScopeError,
} from "@/lib/modules/shared/org-refs";
import type { ModuleContext } from "@/lib/modules/shared/types";
import {
  AllocationValidationError,
  validateVersementAllocations,
} from "./allocations";
import type { RecordTransactionInput } from "./schemas";
import {
  allowsAllocations,
  entryTypeForTransactionType,
  ensureDefaultTransactionTypes,
  getTransactionTypeById,
} from "./transaction-types";

export { AllocationValidationError };

export type LedgerAllocationRow = {
  id: string;
  dossierId: string;
  dossierNumber: string;
  blReference: string | null;
  amount: bigint;
};

export type LedgerEntryListItem = {
  id: string;
  customerId: string;
  customerName: string;
  transactionTypeId: string | null;
  transactionTypeName: string;
  entryType: (typeof ledgerEntries.$inferSelect)["entryType"];
  balanceSide: BalanceSide;
  amount: bigint;
  label: string;
  notes: string | null;
  effectiveDate: string;
  category: (typeof ledgerEntries.$inferSelect)["category"];
  dossierId: string | null;
  dossierNumber: string | null;
  declarationId: string | null;
  createdAt: Date;
  allocations: LedgerAllocationRow[];
};

export type LedgerListFilters = {
  customerId?: string;
  transactionTypeId?: string;
  balanceSide?: BalanceSide;
  entryType?: (typeof ledgerEntries.$inferSelect)["entryType"];
  category?: NonNullable<(typeof ledgerEntries.$inferSelect)["category"]>;
  categoryIsNull?: boolean;
  dossierId?: string;
  hasDossier?: boolean;
  search?: string;
  amountMin?: bigint;
  amountMax?: bigint;
  dateFrom?: string;
  dateTo?: string;
};

export type DossierAllocationOption = {
  id: string;
  dossierNumber: string;
  blReference: string | null;
};

export async function listDossiersForCustomer(
  db: DbLike,
  ctx: ModuleContext,
  customerId: string,
): Promise<DossierAllocationOption[]> {
  await assertCustomerInOrg(db, ctx.organizationId, customerId);

  return db
    .select({
      id: dossiers.id,
      dossierNumber: dossiers.dossierNumber,
      blReference: dossiers.blReference,
    })
    .from(dossiers)
    .where(
      and(
        eq(dossiers.organizationId, ctx.organizationId),
        eq(dossiers.customerId, customerId),
      ),
    )
    .orderBy(desc(dossiers.createdAt));
}

async function loadAllocationsForEntries(
  db: DbLike,
  organizationId: string,
  entryIds: string[],
): Promise<Map<string, LedgerAllocationRow[]>> {
  if (entryIds.length === 0) return new Map();

  const allocationRows = await db
    .select({
      id: paymentAllocations.id,
      ledgerEntryId: paymentAllocations.ledgerEntryId,
      dossierId: paymentAllocations.dossierId,
      amount: paymentAllocations.amount,
      dossierNumber: dossiers.dossierNumber,
      blReference: dossiers.blReference,
    })
    .from(paymentAllocations)
    .innerJoin(dossiers, eq(paymentAllocations.dossierId, dossiers.id))
    .where(
      and(
        eq(paymentAllocations.organizationId, organizationId),
        inArray(paymentAllocations.ledgerEntryId, entryIds),
      ),
    );

  const byEntry = new Map<string, LedgerAllocationRow[]>();
  for (const row of allocationRows) {
    const list = byEntry.get(row.ledgerEntryId) ?? [];
    list.push({
      id: row.id,
      dossierId: row.dossierId,
      dossierNumber: row.dossierNumber,
      blReference: row.blReference,
      amount: row.amount,
    });
    byEntry.set(row.ledgerEntryId, list);
  }
  return byEntry;
}

type EntryRow = {
  id: string;
  customerId: string;
  customerName: string;
  transactionTypeId: string | null;
  transactionTypeName: string | null;
  dossierNumber: string | null;
  entry: typeof ledgerEntries.$inferSelect;
};

function mapEntryRow(
  row: EntryRow,
  allocations: Map<string, LedgerAllocationRow[]>,
): LedgerEntryListItem {
  const { entry } = row;
  return {
    id: entry.id,
    customerId: row.customerId,
    customerName: row.customerName,
    transactionTypeId: row.transactionTypeId,
    transactionTypeName: row.transactionTypeName ?? entry.entryType,
    entryType: entry.entryType,
    balanceSide: entry.balanceSide,
    amount: entry.amount,
    label: entry.label,
    notes: entry.notes,
    effectiveDate: entry.effectiveDate,
    category: entry.category,
    dossierId: entry.dossierId,
    dossierNumber: row.dossierNumber ?? null,
    declarationId: entry.declarationId,
    createdAt: entry.createdAt,
    allocations: allocations.get(entry.id) ?? [],
  };
}

async function queryLedgerEntries(
  db: DbLike,
  ctx: ModuleContext,
  filters: LedgerListFilters,
): Promise<LedgerEntryListItem[]> {
  await ensureDefaultTransactionTypes(db, ctx.organizationId);

  const conditions = [eq(ledgerEntries.organizationId, ctx.organizationId)];

  if (filters.customerId) {
    conditions.push(eq(ledgerEntries.customerId, filters.customerId));
  }
  if (filters.transactionTypeId) {
    conditions.push(
      eq(ledgerEntries.transactionTypeId, filters.transactionTypeId),
    );
  }
  if (filters.balanceSide) {
    conditions.push(eq(ledgerEntries.balanceSide, filters.balanceSide));
  }
  if (filters.entryType) {
    conditions.push(eq(ledgerEntries.entryType, filters.entryType));
  }
  if (filters.category) {
    conditions.push(eq(ledgerEntries.category, filters.category));
  }
  if (filters.categoryIsNull) {
    conditions.push(isNull(ledgerEntries.category));
  }
  if (filters.amountMin !== undefined) {
    conditions.push(gte(ledgerEntries.amount, filters.amountMin));
  }
  if (filters.amountMax !== undefined) {
    conditions.push(lte(ledgerEntries.amount, filters.amountMax));
  }
  if (filters.search?.trim()) {
    const term = `%${filters.search.trim().replace(/[%_]/g, "")}%`;
    conditions.push(
      or(
        ilike(ledgerEntries.label, term),
        ilike(ledgerEntries.notes, term),
      )!,
    );
  }
  if (filters.dossierId) {
    conditions.push(
      or(
        eq(ledgerEntries.dossierId, filters.dossierId),
        exists(
          db
            .select({ one: sql`1` })
            .from(paymentAllocations)
            .where(
              and(
                eq(paymentAllocations.ledgerEntryId, ledgerEntries.id),
                eq(paymentAllocations.dossierId, filters.dossierId),
              ),
            ),
        ),
      )!,
    );
  }
  if (filters.hasDossier === true) {
    conditions.push(
      or(
        isNotNull(ledgerEntries.dossierId),
        exists(
          db
            .select({ one: sql`1` })
            .from(paymentAllocations)
            .where(eq(paymentAllocations.ledgerEntryId, ledgerEntries.id)),
        ),
      )!,
    );
  }
  if (filters.hasDossier === false) {
    conditions.push(
      and(
        isNull(ledgerEntries.dossierId),
        not(
          exists(
            db
              .select({ one: sql`1` })
              .from(paymentAllocations)
              .where(eq(paymentAllocations.ledgerEntryId, ledgerEntries.id)),
          ),
        ),
      )!,
    );
  }
  if (filters.dateFrom) {
    conditions.push(gte(ledgerEntries.effectiveDate, filters.dateFrom));
  }
  if (filters.dateTo) {
    conditions.push(lte(ledgerEntries.effectiveDate, filters.dateTo));
  }

  const rows = await db
    .select({
      id: ledgerEntries.id,
      customerId: ledgerEntries.customerId,
      customerName: customers.name,
      transactionTypeId: ledgerEntries.transactionTypeId,
      transactionTypeName: ledgerTransactionTypes.name,
      dossierNumber: dossiers.dossierNumber,
      entry: ledgerEntries,
    })
    .from(ledgerEntries)
    .innerJoin(customers, eq(ledgerEntries.customerId, customers.id))
    .leftJoin(
      ledgerTransactionTypes,
      eq(ledgerEntries.transactionTypeId, ledgerTransactionTypes.id),
    )
    .leftJoin(dossiers, eq(ledgerEntries.dossierId, dossiers.id))
    .where(and(...conditions))
    .orderBy(desc(ledgerEntries.effectiveDate), desc(ledgerEntries.createdAt));

  const entryIds = rows.map((r) => r.id);
  const allocations = await loadAllocationsForEntries(
    db,
    ctx.organizationId,
    entryIds,
  );

  return rows.map((row) => mapEntryRow(row, allocations));
}

export async function listLedgerEntriesForCustomer(
  db: DbLike,
  ctx: ModuleContext,
  customerId: string,
): Promise<LedgerEntryListItem[]> {
  await assertCustomerInOrg(db, ctx.organizationId, customerId);
  return queryLedgerEntries(db, ctx, { customerId });
}

export async function listLedgerEntriesForOrganization(
  db: DbLike,
  ctx: ModuleContext,
  filters: LedgerListFilters = {},
): Promise<LedgerEntryListItem[]> {
  return queryLedgerEntries(db, ctx, filters);
}

export async function recordTransaction(
  db: DbLike,
  ctx: ModuleContext,
  input: RecordTransactionInput,
) {
  await assertCustomerInOrg(db, ctx.organizationId, input.customerId);
  await ensureDefaultTransactionTypes(db, ctx.organizationId);

  const type = await getTransactionTypeById(
    db,
    ctx.organizationId,
    input.transactionTypeId,
  );
  if (!type || !type.active) {
    throw new OrgScopeError("Type de transaction introuvable.");
  }

  const allocations = input.allocations ?? [];
  if (allowsAllocations(type)) {
    validateVersementAllocations(input.amount, allocations);
    for (const line of allocations) {
      await assertDossierInOrgForCustomer(
        db,
        ctx.organizationId,
        line.dossierId,
        input.customerId,
      );
    }
  } else if (allocations.length > 0) {
    throw new AllocationValidationError(
      "Les affectations dossier ne s'appliquent qu'aux écritures crédit.",
    );
  }

  let dossierId = input.dossierId;
  const declarationId = input.declarationId;

  if (declarationId) {
    const decl = await assertDeclarationInOrgForCustomer(
      db,
      ctx.organizationId,
      declarationId,
      input.customerId,
    );
    dossierId = decl.dossierId;
  } else if (dossierId) {
    await assertDossierInOrgForCustomer(
      db,
      ctx.organizationId,
      dossierId,
      input.customerId,
    );
  }

  const entryType = entryTypeForTransactionType(type);
  const balanceSide = type.balanceSide;

  return db.transaction(async (tx) => {
    const [entry] = await tx
      .insert(ledgerEntries)
      .values({
        organizationId: ctx.organizationId,
        customerId: input.customerId,
        transactionTypeId: type.id,
        dossierId: dossierId ?? null,
        declarationId: declarationId ?? null,
        entryType,
        balanceSide,
        amount: input.amount,
        label: input.label.trim(),
        notes: input.notes?.trim() || null,
        effectiveDate: input.effectiveDate,
        createdBy: ctx.userId,
      })
      .returning();

    if (allocations.length > 0) {
      await tx.insert(paymentAllocations).values(
        allocations.map((line) => ({
          organizationId: ctx.organizationId,
          ledgerEntryId: entry.id,
          dossierId: line.dossierId,
          amount: line.amount,
        })),
      );
    }

    await appendActivity(tx, {
      organizationId: ctx.organizationId,
      entityType: "ledger_entry",
      entityId: entry.id,
      action: "ledger.transaction_recorded",
      payload: {
        transactionType: type.name,
        amount: entry.amount.toString(),
        balanceSide: entry.balanceSide,
      },
      actorId: ctx.userId,
    });

    return entry;
  });
}

/** @deprecated Use recordTransaction */
export async function recordVersement(
  db: DbLike,
  ctx: ModuleContext,
  input: RecordTransactionInput,
) {
  return recordTransaction(db, ctx, input);
}

/** @deprecated Use recordTransaction */
export async function recordCharge(
  db: DbLike,
  ctx: ModuleContext,
  input: RecordTransactionInput,
) {
  return recordTransaction(db, ctx, input);
}
