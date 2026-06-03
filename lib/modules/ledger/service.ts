import { and, desc, eq, inArray } from "drizzle-orm";
import type { DbLike } from "@/lib/db";
import type { BalanceSide } from "@/lib/db/enums";
import {
  declarations,
  dossiers,
  ledgerEntries,
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
import type { RecordChargeInput, RecordVersementInput } from "./schemas";

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
  entryType: (typeof ledgerEntries.$inferSelect)["entryType"];
  balanceSide: BalanceSide;
  amount: bigint;
  label: string;
  notes: string | null;
  effectiveDate: string;
  category: (typeof ledgerEntries.$inferSelect)["category"];
  dossierId: string | null;
  declarationId: string | null;
  createdAt: Date;
  allocations: LedgerAllocationRow[];
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

export async function listLedgerEntriesForCustomer(
  db: DbLike,
  ctx: ModuleContext,
  customerId: string,
): Promise<LedgerEntryListItem[]> {
  await assertCustomerInOrg(db, ctx.organizationId, customerId);

  const entries = await db
    .select()
    .from(ledgerEntries)
    .where(
      and(
        eq(ledgerEntries.organizationId, ctx.organizationId),
        eq(ledgerEntries.customerId, customerId),
      ),
    )
    .orderBy(desc(ledgerEntries.effectiveDate), desc(ledgerEntries.createdAt));

  if (entries.length === 0) {
    return [];
  }

  const entryIds = entries.map((e) => e.id);
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
        eq(paymentAllocations.organizationId, ctx.organizationId),
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

  return entries.map((entry) => ({
    id: entry.id,
    entryType: entry.entryType,
    balanceSide: entry.balanceSide,
    amount: entry.amount,
    label: entry.label,
    notes: entry.notes,
    effectiveDate: entry.effectiveDate,
    category: entry.category,
    dossierId: entry.dossierId,
    declarationId: entry.declarationId,
    createdAt: entry.createdAt,
    allocations: byEntry.get(entry.id) ?? [],
  }));
}

export async function recordVersement(
  db: DbLike,
  ctx: ModuleContext,
  input: RecordVersementInput,
) {
  await assertCustomerInOrg(db, ctx.organizationId, input.customerId);

  const allocations = input.allocations ?? [];
  validateVersementAllocations(input.amount, allocations);

  for (const line of allocations) {
    await assertDossierInOrgForCustomer(
      db,
      ctx.organizationId,
      line.dossierId,
      input.customerId,
    );
  }

  return db.transaction(async (tx) => {
    const [entry] = await tx
      .insert(ledgerEntries)
      .values({
        organizationId: ctx.organizationId,
        customerId: input.customerId,
        entryType: "versement",
        balanceSide: "credit",
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
      action: "ledger.versement_recorded",
      payload: {
        amount: entry.amount.toString(),
        balanceSide: entry.balanceSide,
        allocationTotal: allocations
          .reduce((s, a) => s + a.amount, BigInt(0))
          .toString(),
      },
      actorId: ctx.userId,
    });

    return entry;
  });
}

export async function recordCharge(
  db: DbLike,
  ctx: ModuleContext,
  input: RecordChargeInput,
) {
  await assertCustomerInOrg(db, ctx.organizationId, input.customerId);

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

  return db.transaction(async (tx) => {
    const [entry] = await tx
      .insert(ledgerEntries)
      .values({
        organizationId: ctx.organizationId,
        customerId: input.customerId,
        dossierId: dossierId ?? null,
        declarationId: declarationId ?? null,
        entryType: "charge",
        balanceSide: "debit",
        category: input.category ?? null,
        amount: input.amount,
        label: input.label.trim(),
        notes: input.notes?.trim() || null,
        effectiveDate: input.effectiveDate,
        createdBy: ctx.userId,
      })
      .returning();

    await appendActivity(tx, {
      organizationId: ctx.organizationId,
      entityType: "ledger_entry",
      entityId: entry.id,
      action: "ledger.charge_recorded",
      payload: {
        amount: entry.amount.toString(),
        balanceSide: entry.balanceSide,
        dossierId: entry.dossierId,
        declarationId: entry.declarationId,
      },
      actorId: ctx.userId,
    });

    return entry;
  });
}

