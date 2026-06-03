import { and, desc, eq, inArray, ne, sql } from "drizzle-orm";
import type { DbLike } from "@/lib/db";
import { customers, declarations, dossiers } from "@/lib/db/schema";
import { listRecentOrganizationActivity } from "@/lib/modules/activity/service";
import type { ModuleContext } from "@/lib/modules/shared/types";

async function listDossiersReadyToClose(
  db: DbLike,
  organizationId: string,
  limit: number,
) {
  const openRows = await db
    .select({ id: dossiers.id, dossierNumber: dossiers.dossierNumber })
    .from(dossiers)
    .where(
      and(
        eq(dossiers.organizationId, organizationId),
        eq(dossiers.caseStatus, "open"),
      ),
    )
    .orderBy(desc(dossiers.updatedAt))
    .limit(30);

  if (openRows.length === 0) return [];

  const dossierIds = openRows.map((r) => r.id);
  const declRows = await db
    .select({
      dossierId: declarations.dossierId,
      bonADelivrer: declarations.bonADelivrer,
    })
    .from(declarations)
    .where(
      and(
        eq(declarations.organizationId, organizationId),
        inArray(declarations.dossierId, dossierIds),
      ),
    );

  const stats = new Map<string, { total: number; pendingBad: number }>();
  for (const row of declRows) {
    if (!row.dossierId) continue;
    const cur = stats.get(row.dossierId) ?? { total: 0, pendingBad: 0 };
    cur.total += 1;
    if (!row.bonADelivrer) cur.pendingBad += 1;
    stats.set(row.dossierId, cur);
  }

  return openRows
    .filter((d) => {
      const s = stats.get(d.id);
      return s != null && s.total > 0 && s.pendingBad === 0;
    })
    .slice(0, limit);
}

export type DashboardTodoItem = {
  id: string;
  kind:
    | "declaration_pending"
    | "client_watch"
    | "dossier_ready_to_close";
  title: string;
  description: string;
  href: string;
};

export type DashboardSnapshot = {
  declarationsEnCours: number;
  dossiersOuverts: number;
  soldesASurveiller: number;
  todo: DashboardTodoItem[];
  recentActivity: Awaited<ReturnType<typeof listRecentOrganizationActivity>>;
};

export async function getDashboardSnapshot(
  db: DbLike,
  ctx: ModuleContext,
): Promise<DashboardSnapshot> {
  const orgId = ctx.organizationId;

  const [
    [declPendingRow],
    [dossiersOpenRow],
    [clientsWatchRow],
    pendingDecls,
    watchClients,
    readyDossiers,
    recentActivity,
  ] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(declarations)
      .where(
        and(
          eq(declarations.organizationId, orgId),
          eq(declarations.bonADelivrer, false),
        ),
      ),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(dossiers)
      .where(
        and(
          eq(dossiers.organizationId, orgId),
          ne(dossiers.caseStatus, "closed"),
        ),
      ),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(customers)
      .where(
        and(
          eq(customers.organizationId, orgId),
          eq(customers.accountStatus, "pas_a_jour"),
        ),
      ),
    db
      .select({
        id: declarations.id,
        declarationNumber: declarations.declarationNumber,
      })
      .from(declarations)
      .where(
        and(
          eq(declarations.organizationId, orgId),
          eq(declarations.bonADelivrer, false),
        ),
      )
      .orderBy(desc(declarations.updatedAt))
      .limit(5),
    db
      .select({ id: customers.id, name: customers.name })
      .from(customers)
      .where(
        and(
          eq(customers.organizationId, orgId),
          eq(customers.accountStatus, "pas_a_jour"),
        ),
      )
      .orderBy(customers.name)
      .limit(5),
    listDossiersReadyToClose(db, orgId, 5),
    listRecentOrganizationActivity(db, ctx, 15),
  ]);

  const todo: DashboardTodoItem[] = [];

  for (const row of pendingDecls) {
    todo.push({
      id: `decl-${row.id}`,
      kind: "declaration_pending",
      title: row.declarationNumber,
      description: "Bon à délivrer non coché",
      href: `/declarations?open=${row.id}`,
    });
  }

  for (const row of watchClients) {
    todo.push({
      id: `client-${row.id}`,
      kind: "client_watch",
      title: row.name,
      description: "Compte non réconcilié (pas à jour)",
      href: `/clients/${row.id}`,
    });
  }

  for (const row of readyDossiers) {
    todo.push({
      id: `dossier-${row.id}`,
      kind: "dossier_ready_to_close",
      title: row.dossierNumber,
      description: "Toutes les déclarations sont BAD — dossier ouvert",
      href: `/dossiers/${row.id}`,
    });
  }

  return {
    declarationsEnCours: declPendingRow?.count ?? 0,
    dossiersOuverts: dossiersOpenRow?.count ?? 0,
    soldesASurveiller: clientsWatchRow?.count ?? 0,
    todo: todo.slice(0, 12),
    recentActivity,
  };
}
