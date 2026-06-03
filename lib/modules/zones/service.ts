import { and, asc, eq } from "drizzle-orm";
import type { DbLike } from "@/lib/db";
import { organizationZones } from "@/lib/db/schema";
import { DEFAULT_ZONE_TERMINALS } from "@/lib/domain/pilot-zones";
import type { ModuleContext } from "@/lib/modules/shared/types";

export type OrganizationZoneRow = {
  id: string;
  slug: string;
  label: string;
  isActive: boolean;
  sortOrder: number;
};

export function normalizeZoneSlug(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, "");
}

function mapRow(row: typeof organizationZones.$inferSelect): OrganizationZoneRow {
  return {
    id: row.id,
    slug: row.slug,
    label: row.label,
    isActive: row.isActive,
    sortOrder: row.sortOrder,
  };
}

export async function ensureDefaultZones(
  db: DbLike,
  organizationId: string,
): Promise<void> {
  const existing = await db
    .select({ id: organizationZones.id })
    .from(organizationZones)
    .where(eq(organizationZones.organizationId, organizationId))
    .limit(1);

  if (existing.length > 0) return;

  await db.insert(organizationZones).values(
    DEFAULT_ZONE_TERMINALS.map((z, index) => ({
      organizationId,
      slug: z.slug,
      label: z.label,
      sortOrder: (index + 1) * 10,
      isActive: true,
    })),
  );
}

export async function listZones(
  db: DbLike,
  ctx: ModuleContext,
  activeOnly = true,
): Promise<OrganizationZoneRow[]> {
  await ensureDefaultZones(db, ctx.organizationId);

  const conditions = [eq(organizationZones.organizationId, ctx.organizationId)];
  if (activeOnly) {
    conditions.push(eq(organizationZones.isActive, true));
  }

  const rows = await db
    .select()
    .from(organizationZones)
    .where(and(...conditions))
    .orderBy(asc(organizationZones.sortOrder), asc(organizationZones.slug));

  return rows.map(mapRow);
}

export async function createZone(
  db: DbLike,
  ctx: ModuleContext,
  input: { slug: string; label: string },
): Promise<OrganizationZoneRow> {
  await ensureDefaultZones(db, ctx.organizationId);

  const slug = normalizeZoneSlug(input.slug);
  if (!slug) {
    throw new Error("Le code zone est requis.");
  }

  const maxSort = await db
    .select({ sortOrder: organizationZones.sortOrder })
    .from(organizationZones)
    .where(eq(organizationZones.organizationId, ctx.organizationId))
    .orderBy(asc(organizationZones.sortOrder));

  const nextSort =
    maxSort.length > 0 ? maxSort[maxSort.length - 1]!.sortOrder + 10 : 10;

  const [row] = await db
    .insert(organizationZones)
    .values({
      organizationId: ctx.organizationId,
      slug,
      label: input.label.trim(),
      sortOrder: nextSort,
      isActive: true,
    })
    .returning();

  return mapRow(row);
}

export async function updateZone(
  db: DbLike,
  ctx: ModuleContext,
  zoneId: string,
  input: { label?: string; isActive?: boolean },
): Promise<OrganizationZoneRow | null> {
  const patch: { label?: string; isActive?: boolean } = {};
  if (input.label !== undefined) patch.label = input.label.trim();
  if (input.isActive !== undefined) patch.isActive = input.isActive;

  const [row] = await db
    .update(organizationZones)
    .set(patch)
    .where(
      and(
        eq(organizationZones.id, zoneId),
        eq(organizationZones.organizationId, ctx.organizationId),
      ),
    )
    .returning();

  return row ? mapRow(row) : null;
}
