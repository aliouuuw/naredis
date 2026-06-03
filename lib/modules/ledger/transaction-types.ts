import { and, asc, eq, isNull } from "drizzle-orm";
import type { DbLike } from "@/lib/db";
import type { BalanceSide } from "@/lib/db/enums";
import type { LedgerEntryType } from "@/lib/domain/ledger-labels";
import { ledgerEntries, ledgerTransactionTypes } from "@/lib/db/schema";
import { slugFromName } from "@/lib/utils/slug";
import type { ModuleContext } from "@/lib/modules/shared/types";

export type TransactionTypeRow = {
  id: string;
  name: string;
  code: string;
  balanceSide: BalanceSide;
  systemKey: LedgerEntryType | null;
  isSystem: boolean;
  active: boolean;
  sortOrder: number;
};

const SYSTEM_DEFAULTS: Array<{
  name: string;
  code: string;
  balanceSide: BalanceSide;
  systemKey: LedgerEntryType;
  sortOrder: number;
}> = [
  {
    name: "Versement",
    code: "versement",
    balanceSide: "credit",
    systemKey: "versement",
    sortOrder: 10,
  },
  {
    name: "Charge",
    code: "charge",
    balanceSide: "debit",
    systemKey: "charge",
    sortOrder: 20,
  },
  {
    name: "Solde d'ouverture",
    code: "opening_balance",
    balanceSide: "debit",
    systemKey: "opening_balance",
    sortOrder: 30,
  },
  {
    name: "Contre-passation",
    code: "reversal",
    balanceSide: "debit",
    systemKey: "reversal",
    sortOrder: 40,
  },
];

function mapRow(row: typeof ledgerTransactionTypes.$inferSelect): TransactionTypeRow {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    balanceSide: row.balanceSide,
    systemKey: row.systemKey,
    isSystem: row.isSystem,
    active: row.active,
    sortOrder: row.sortOrder,
  };
}

export async function ensureDefaultTransactionTypes(
  db: DbLike,
  organizationId: string,
): Promise<void> {
  const existing = await db
    .select({ code: ledgerTransactionTypes.code })
    .from(ledgerTransactionTypes)
    .where(eq(ledgerTransactionTypes.organizationId, organizationId));

  const codes = new Set(existing.map((r) => r.code));
  const missing = SYSTEM_DEFAULTS.filter((d) => !codes.has(d.code));
  if (missing.length === 0) return;

  await db.insert(ledgerTransactionTypes).values(
    missing.map((d) => ({
      organizationId,
      name: d.name,
      code: d.code,
      balanceSide: d.balanceSide,
      systemKey: d.systemKey,
      isSystem: true,
      active: true,
      sortOrder: d.sortOrder,
    })),
  );

  await backfillLedgerEntryTransactionTypes(db, organizationId);
}

/** Links historical rows to system types after migration. */
export async function backfillLedgerEntryTransactionTypes(
  db: DbLike,
  organizationId: string,
): Promise<void> {
  const types = await db
    .select()
    .from(ledgerTransactionTypes)
    .where(eq(ledgerTransactionTypes.organizationId, organizationId));

  for (const type of types) {
    if (!type.systemKey) continue;
    await db
      .update(ledgerEntries)
      .set({ transactionTypeId: type.id })
      .where(
        and(
          eq(ledgerEntries.organizationId, organizationId),
          eq(ledgerEntries.entryType, type.systemKey),
          isNull(ledgerEntries.transactionTypeId),
        ),
      );
  }
}

export async function listTransactionTypes(
  db: DbLike,
  ctx: ModuleContext,
  options?: { activeOnly?: boolean },
): Promise<TransactionTypeRow[]> {
  await ensureDefaultTransactionTypes(db, ctx.organizationId);

  const rows = await db
    .select()
    .from(ledgerTransactionTypes)
    .where(eq(ledgerTransactionTypes.organizationId, ctx.organizationId))
    .orderBy(
      asc(ledgerTransactionTypes.sortOrder),
      asc(ledgerTransactionTypes.name),
    );

  if (options?.activeOnly === false) {
    return rows.map(mapRow);
  }

  return rows.filter((r) => r.active).map(mapRow);
}

export async function getTransactionTypeById(
  db: DbLike,
  organizationId: string,
  transactionTypeId: string,
): Promise<TransactionTypeRow | null> {
  const [row] = await db
    .select()
    .from(ledgerTransactionTypes)
    .where(
      and(
        eq(ledgerTransactionTypes.id, transactionTypeId),
        eq(ledgerTransactionTypes.organizationId, organizationId),
      ),
    )
    .limit(1);

  return row ? mapRow(row) : null;
}

export async function createTransactionType(
  db: DbLike,
  ctx: ModuleContext,
  input: { name: string; balanceSide: BalanceSide },
): Promise<TransactionTypeRow> {
  await ensureDefaultTransactionTypes(db, ctx.organizationId);

  const baseCode = slugFromName(input.name);
  let code = baseCode;
  for (let i = 0; i < 100; i += 1) {
    const [existing] = await db
      .select({ id: ledgerTransactionTypes.id })
      .from(ledgerTransactionTypes)
      .where(
        and(
          eq(ledgerTransactionTypes.organizationId, ctx.organizationId),
          eq(ledgerTransactionTypes.code, code),
        ),
      )
      .limit(1);
    if (!existing) break;
    code = `${baseCode}-${i + 1}`;
  }

  const maxSort = await db
    .select({ sortOrder: ledgerTransactionTypes.sortOrder })
    .from(ledgerTransactionTypes)
    .where(eq(ledgerTransactionTypes.organizationId, ctx.organizationId))
    .orderBy(asc(ledgerTransactionTypes.sortOrder));

  const nextSort =
    maxSort.length > 0 ? maxSort[maxSort.length - 1]!.sortOrder + 10 : 100;

  const [row] = await db
    .insert(ledgerTransactionTypes)
    .values({
      organizationId: ctx.organizationId,
      name: input.name.trim(),
      code,
      balanceSide: input.balanceSide,
      isSystem: false,
      active: true,
      sortOrder: nextSort,
    })
    .returning();

  return mapRow(row);
}

export async function updateTransactionType(
  db: DbLike,
  ctx: ModuleContext,
  transactionTypeId: string,
  input: { name: string },
): Promise<TransactionTypeRow> {
  const existing = await getTransactionTypeById(
    db,
    ctx.organizationId,
    transactionTypeId,
  );
  if (!existing) {
    throw new Error("Type de transaction introuvable.");
  }

  const [row] = await db
    .update(ledgerTransactionTypes)
    .set({ name: input.name.trim() })
    .where(
      and(
        eq(ledgerTransactionTypes.id, transactionTypeId),
        eq(ledgerTransactionTypes.organizationId, ctx.organizationId),
      ),
    )
    .returning();

  return mapRow(row);
}

/** Maps a transaction type to the legacy `ledger_entry_type` enum column. */
export function entryTypeForTransactionType(type: TransactionTypeRow): LedgerEntryType {
  if (type.systemKey) return type.systemKey;
  return type.balanceSide === "credit" ? "versement" : "charge";
}

export function allowsAllocations(type: TransactionTypeRow): boolean {
  return type.balanceSide === "credit";
}
