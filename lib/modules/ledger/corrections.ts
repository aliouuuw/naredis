import { and, eq, inArray } from "drizzle-orm";
import type { DbLike } from "@/lib/db";
import type { BalanceSide } from "@/lib/db/enums";
import { ledgerEntries } from "@/lib/db/schema";
import { agencyCalendarDate } from "@/lib/domain/timezone";
import { appendActivity } from "@/lib/modules/activity/append-activity";
import { assertCustomerInOrg } from "@/lib/modules/shared/org-refs";
import type { ModuleContext } from "@/lib/modules/shared/types";
import {
  ensureDefaultTransactionTypes,
  getTransactionTypeBySystemKey,
} from "./transaction-types";

export class LedgerCorrectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LedgerCorrectionError";
  }
}

export async function customerHasOpeningBalance(
  db: DbLike,
  organizationId: string,
  customerId: string,
): Promise<boolean> {
  const [row] = await db
    .select({ id: ledgerEntries.id })
    .from(ledgerEntries)
    .where(
      and(
        eq(ledgerEntries.organizationId, organizationId),
        eq(ledgerEntries.customerId, customerId),
        eq(ledgerEntries.entryType, "opening_balance"),
      ),
    )
    .limit(1);

  return Boolean(row);
}

export type RecordOpeningBalanceInput = {
  customerId: string;
  amount: bigint;
  balanceSide: BalanceSide;
  effectiveDate?: string;
  label?: string;
  notes?: string;
};

export async function recordOpeningBalance(
  db: DbLike,
  ctx: ModuleContext,
  input: RecordOpeningBalanceInput,
) {
  await assertCustomerInOrg(db, ctx.organizationId, input.customerId);
  await ensureDefaultTransactionTypes(db, ctx.organizationId);

  if (await customerHasOpeningBalance(db, ctx.organizationId, input.customerId)) {
    throw new LedgerCorrectionError(
      "Ce client a déjà un solde d'ouverture enregistré.",
    );
  }

  const type = await getTransactionTypeBySystemKey(
    db,
    ctx.organizationId,
    "opening_balance",
  );
  if (!type) {
    throw new LedgerCorrectionError("Type « Solde d'ouverture » introuvable.");
  }

  const effectiveDate = input.effectiveDate?.trim() || agencyCalendarDate();
  const label =
    input.label?.trim() ||
    `Solde d'ouverture — ${effectiveDate.slice(0, 4)}`;

  return insertOpeningBalanceEntry(db, ctx, {
    ...input,
    effectiveDate,
    label,
    typeId: type.id,
  });
}

async function insertOpeningBalanceEntry(
  db: DbLike,
  ctx: ModuleContext,
  input: RecordOpeningBalanceInput & {
    effectiveDate: string;
    label: string;
    typeId: string;
  },
) {
  const [entry] = await db
    .insert(ledgerEntries)
    .values({
      organizationId: ctx.organizationId,
      customerId: input.customerId,
      transactionTypeId: input.typeId,
      entryType: "opening_balance",
      balanceSide: input.balanceSide,
      amount: input.amount,
      label: input.label,
      notes: input.notes?.trim() || null,
      effectiveDate: input.effectiveDate,
      createdBy: ctx.userId,
    })
    .returning();

  await appendActivity(db, {
    organizationId: ctx.organizationId,
    entityType: "ledger_entry",
    entityId: entry.id,
    action: "ledger.opening_balance_recorded",
    payload: {
      amount: entry.amount.toString(),
      balanceSide: entry.balanceSide,
    },
    actorId: ctx.userId,
  });

  return entry;
}

export type ReverseLedgerEntryInput = {
  entryId: string;
  reason: string;
  effectiveDate?: string;
};

export async function reverseLedgerEntry(
  db: DbLike,
  ctx: ModuleContext,
  input: ReverseLedgerEntryInput,
) {
  await ensureDefaultTransactionTypes(db, ctx.organizationId);

  const [original] = await db
    .select()
    .from(ledgerEntries)
    .where(
      and(
        eq(ledgerEntries.id, input.entryId),
        eq(ledgerEntries.organizationId, ctx.organizationId),
      ),
    )
    .limit(1);

  if (!original) {
    throw new LedgerCorrectionError("Écriture introuvable.");
  }

  if (original.entryType === "reversal") {
    throw new LedgerCorrectionError(
      "Impossible de contre-passer une contre-passation.",
    );
  }

  const [existingReversal] = await db
    .select({ id: ledgerEntries.id })
    .from(ledgerEntries)
    .where(eq(ledgerEntries.reversesEntryId, original.id))
    .limit(1);

  if (existingReversal) {
    throw new LedgerCorrectionError("Cette écriture a déjà été contre-passée.");
  }

  const reversalType = await getTransactionTypeBySystemKey(
    db,
    ctx.organizationId,
    "reversal",
  );
  if (!reversalType) {
    throw new LedgerCorrectionError("Type « Contre-passation » introuvable.");
  }

  const oppositeSide: BalanceSide =
    original.balanceSide === "debit" ? "credit" : "debit";
  const effectiveDate = input.effectiveDate?.trim() || agencyCalendarDate();
  const reason = input.reason.trim();

  return db.transaction(async (tx) => {
    const [entry] = await tx
      .insert(ledgerEntries)
      .values({
        organizationId: ctx.organizationId,
        customerId: original.customerId,
        transactionTypeId: reversalType.id,
        dossierId: original.dossierId,
        declarationId: original.declarationId,
        entryType: "reversal",
        balanceSide: oppositeSide,
        amount: original.amount,
        label: `Contre-passation — ${original.label}`,
        notes: reason,
        effectiveDate,
        reversesEntryId: original.id,
        createdBy: ctx.userId,
      })
      .returning();

    await appendActivity(tx, {
      organizationId: ctx.organizationId,
      entityType: "ledger_entry",
      entityId: entry.id,
      action: "ledger.entry_reversed",
      payload: {
        reversesEntryId: original.id,
        amount: entry.amount.toString(),
      },
      actorId: ctx.userId,
    });

    return entry;
  });
}
