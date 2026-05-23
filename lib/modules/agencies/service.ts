import { and, eq } from "drizzle-orm";
import type { DbLike } from "@/lib/db";
import { organizationAgencies } from "@/lib/db/schema";
import type { ModuleContext } from "@/lib/modules/shared/types";

export async function listAgencies(db: DbLike, ctx: ModuleContext, activeOnly = true) {
  const conditions = [eq(organizationAgencies.organizationId, ctx.organizationId)];
  if (activeOnly) {
    conditions.push(eq(organizationAgencies.isActive, true));
  }

  return db
    .select()
    .from(organizationAgencies)
    .where(and(...conditions))
    .orderBy(organizationAgencies.name);
}

export async function createAgency(
  db: DbLike,
  ctx: ModuleContext,
  input: { name: string; notes?: string },
) {
  const [row] = await db
    .insert(organizationAgencies)
    .values({
      organizationId: ctx.organizationId,
      name: input.name.trim(),
      notes: input.notes?.trim() || null,
    })
    .returning();
  return row;
}

export async function updateAgency(
  db: DbLike,
  ctx: ModuleContext,
  agencyId: string,
  input: { name?: string; notes?: string; isActive?: boolean },
) {
  const patch: {
    name?: string;
    notes?: string | null;
    isActive?: boolean;
  } = {};
  if (input.name !== undefined) patch.name = input.name.trim();
  if (input.notes !== undefined) patch.notes = input.notes.trim() || null;
  if (input.isActive !== undefined) patch.isActive = input.isActive;

  const [row] = await db
    .update(organizationAgencies)
    .set(patch)
    .where(
      and(
        eq(organizationAgencies.id, agencyId),
        eq(organizationAgencies.organizationId, ctx.organizationId),
      ),
    )
    .returning();
  return row ?? null;
}
