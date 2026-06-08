import { and, asc, eq } from "drizzle-orm";
import type { DbLike } from "@/lib/db";
import { gaindeCardDebitTypes } from "@/lib/db/schema";
import { slugFromName } from "@/lib/utils/slug";
import type { ModuleContext } from "@/lib/modules/shared/types";

export type GaindeCardDebitTypeRow = {
  id: string;
  name: string;
  code: string;
  active: boolean;
  sortOrder: number;
};

const DEFAULT_DEBIT_TYPES: Array<{
  name: string;
  code: string;
  sortOrder: number;
}> = [
  { name: "Taxe intérieur", code: "taxe_interieur", sortOrder: 10 },
  { name: "Autre débit", code: "autre_debit", sortOrder: 90 },
];

function mapRow(row: typeof gaindeCardDebitTypes.$inferSelect): GaindeCardDebitTypeRow {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    active: row.active,
    sortOrder: row.sortOrder,
  };
}

export async function ensureDefaultGaindeCardDebitTypes(
  db: DbLike,
  organizationId: string,
): Promise<void> {
  const existing = await db
    .select({ code: gaindeCardDebitTypes.code })
    .from(gaindeCardDebitTypes)
    .where(eq(gaindeCardDebitTypes.organizationId, organizationId));

  const codes = new Set(existing.map((r) => r.code));
  const missing = DEFAULT_DEBIT_TYPES.filter((d) => !codes.has(d.code));
  if (missing.length === 0) return;

  await db.insert(gaindeCardDebitTypes).values(
    missing.map((d) => ({
      organizationId,
      name: d.name,
      code: d.code,
      active: true,
      sortOrder: d.sortOrder,
    })),
  );
}

export async function listGaindeCardDebitTypes(
  db: DbLike,
  ctx: ModuleContext,
  options?: { activeOnly?: boolean },
): Promise<GaindeCardDebitTypeRow[]> {
  await ensureDefaultGaindeCardDebitTypes(db, ctx.organizationId);

  const rows = await db
    .select()
    .from(gaindeCardDebitTypes)
    .where(eq(gaindeCardDebitTypes.organizationId, ctx.organizationId))
    .orderBy(
      asc(gaindeCardDebitTypes.sortOrder),
      asc(gaindeCardDebitTypes.name),
    );

  if (options?.activeOnly === false) {
    return rows.map(mapRow);
  }

  return rows.filter((r) => r.active).map(mapRow);
}

export async function createGaindeCardDebitType(
  db: DbLike,
  ctx: ModuleContext,
  input: { name: string },
): Promise<GaindeCardDebitTypeRow> {
  await ensureDefaultGaindeCardDebitTypes(db, ctx.organizationId);

  const baseCode = slugFromName(input.name);
  let code = baseCode;
  for (let i = 0; i < 100; i += 1) {
    const [existing] = await db
      .select({ id: gaindeCardDebitTypes.id })
      .from(gaindeCardDebitTypes)
      .where(
        and(
          eq(gaindeCardDebitTypes.organizationId, ctx.organizationId),
          eq(gaindeCardDebitTypes.code, code),
        ),
      )
      .limit(1);
    if (!existing) break;
    code = `${baseCode}-${i + 1}`;
  }

  const maxSort = await db
    .select({ sortOrder: gaindeCardDebitTypes.sortOrder })
    .from(gaindeCardDebitTypes)
    .where(eq(gaindeCardDebitTypes.organizationId, ctx.organizationId))
    .orderBy(asc(gaindeCardDebitTypes.sortOrder));

  const nextSort =
    maxSort.length > 0 ? maxSort[maxSort.length - 1]!.sortOrder + 10 : 100;

  const [row] = await db
    .insert(gaindeCardDebitTypes)
    .values({
      organizationId: ctx.organizationId,
      name: input.name.trim(),
      code,
      active: true,
      sortOrder: nextSort,
    })
    .returning();

  if (!row) throw new Error("Impossible de créer le type de débit.");
  return mapRow(row);
}

export async function updateGaindeCardDebitType(
  db: DbLike,
  ctx: ModuleContext,
  debitTypeId: string,
  input: { name: string },
): Promise<GaindeCardDebitTypeRow> {
  const [row] = await db
    .update(gaindeCardDebitTypes)
    .set({ name: input.name.trim() })
    .where(
      and(
        eq(gaindeCardDebitTypes.id, debitTypeId),
        eq(gaindeCardDebitTypes.organizationId, ctx.organizationId),
      ),
    )
    .returning();

  if (!row) throw new Error("Type de débit introuvable.");
  return mapRow(row);
}

export async function setGaindeCardDebitTypeActive(
  db: DbLike,
  ctx: ModuleContext,
  debitTypeId: string,
  active: boolean,
): Promise<GaindeCardDebitTypeRow> {
  const [row] = await db
    .update(gaindeCardDebitTypes)
    .set({ active })
    .where(
      and(
        eq(gaindeCardDebitTypes.id, debitTypeId),
        eq(gaindeCardDebitTypes.organizationId, ctx.organizationId),
      ),
    )
    .returning();

  if (!row) throw new Error("Type de débit introuvable.");
  return mapRow(row);
}
