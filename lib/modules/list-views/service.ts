import { and, asc, eq } from "drizzle-orm";
import type { DbLike } from "@/lib/db";
import { organizationListViews } from "@/lib/db/schema";
import type { ModuleContext } from "@/lib/modules/shared/types";
import type { ListViewPageKey } from "./schemas";

export type OrganizationListViewRow = {
  id: string;
  pageKey: string;
  name: string;
  query: string;
  sortOrder: number;
  createdByUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function mapRow(
  row: typeof organizationListViews.$inferSelect,
): OrganizationListViewRow {
  return {
    id: row.id,
    pageKey: row.pageKey,
    name: row.name,
    query: row.query,
    sortOrder: row.sortOrder,
    createdByUserId: row.createdByUserId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function listOrganizationListViews(
  db: DbLike,
  ctx: ModuleContext,
  pageKey: ListViewPageKey,
): Promise<OrganizationListViewRow[]> {
  const rows = await db
    .select()
    .from(organizationListViews)
    .where(
      and(
        eq(organizationListViews.organizationId, ctx.organizationId),
        eq(organizationListViews.pageKey, pageKey),
      ),
    )
    .orderBy(
      asc(organizationListViews.sortOrder),
      asc(organizationListViews.name),
    );

  return rows.map(mapRow);
}

export async function createOrganizationListView(
  db: DbLike,
  ctx: ModuleContext,
  input: {
    pageKey: ListViewPageKey;
    name: string;
    query: string;
  },
): Promise<OrganizationListViewRow> {
  const name = input.name.trim();
  const query = input.query.trim();

  const existing = await db
    .select({ sortOrder: organizationListViews.sortOrder })
    .from(organizationListViews)
    .where(
      and(
        eq(organizationListViews.organizationId, ctx.organizationId),
        eq(organizationListViews.pageKey, input.pageKey),
      ),
    )
    .orderBy(asc(organizationListViews.sortOrder));

  const maxOrder =
    existing.length > 0
      ? Math.max(...existing.map((r) => r.sortOrder))
      : 0;

  const [inserted] = await db
    .insert(organizationListViews)
    .values({
      organizationId: ctx.organizationId,
      pageKey: input.pageKey,
      name,
      query,
      sortOrder: maxOrder + 10,
      createdByUserId: ctx.userId ?? null,
    })
    .returning();

  if (!inserted) {
    throw new Error("Impossible de créer la vue.");
  }

  const sp = new URLSearchParams(query);
  sp.set("tab", `saved:${inserted.id}`);
  const queryWithTab = sp.toString();

  const [row] = await db
    .update(organizationListViews)
    .set({ query: queryWithTab, updatedAt: new Date() })
    .where(eq(organizationListViews.id, inserted.id))
    .returning();

  return mapRow(row ?? inserted);
}

export async function deleteOrganizationListView(
  db: DbLike,
  ctx: ModuleContext,
  viewId: string,
  pageKey: ListViewPageKey,
): Promise<boolean> {
  const deleted = await db
    .delete(organizationListViews)
    .where(
      and(
        eq(organizationListViews.id, viewId),
        eq(organizationListViews.organizationId, ctx.organizationId),
        eq(organizationListViews.pageKey, pageKey),
      ),
    )
    .returning({ id: organizationListViews.id });

  return deleted.length > 0;
}
