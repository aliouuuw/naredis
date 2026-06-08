import { and, desc, eq, sql } from "drizzle-orm";
import type { DbLike } from "@/lib/db";
import {
  declarationContainers,
  declarations,
  dossiers,
  ledgerEntries,
} from "@/lib/db/schema";
import { parseDeclarationNumberParts } from "@/lib/domain/declaration-number";
import { listZones } from "@/lib/modules/zones/service";
import type { ModuleContext } from "@/lib/modules/shared/types";

export type ZoneCatalogEntry = {
  slug: string;
  label: string;
};

export type FormSuggestions = {
  declarationPrefixes: string[];
  declarationSuffixes: string[];
  zoneCatalog: ZoneCatalogEntry[];
  zoneOrTerminals: string[];
  containerNumbers: string[];
  ledgerLabels: string[];
  dossierTitles: string[];
};

function uniqueNonEmpty(values: (string | null | undefined)[], limit = 40) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of values) {
    const v = raw?.trim();
    if (!v || seen.has(v)) continue;
    seen.add(v);
    out.push(v);
    if (out.length >= limit) break;
  }
  return out;
}

export async function getOrgFormSuggestions(
  db: DbLike,
  ctx: ModuleContext,
): Promise<FormSuggestions> {
  const orgId = ctx.organizationId;

  const [declNumberRows, zoneRows, containerRows, labelRows, titleRows, zones] =
    await Promise.all([
      db
        .select({ num: declarations.declarationNumber })
        .from(declarations)
        .where(eq(declarations.organizationId, orgId))
        .orderBy(desc(declarations.updatedAt))
        .limit(120),
      db
        .select({ zone: declarations.zoneOrTerminal })
        .from(declarations)
        .where(
          and(
            eq(declarations.organizationId, orgId),
            sql`${declarations.zoneOrTerminal} is not null`,
          ),
        )
        .orderBy(desc(declarations.updatedAt))
        .limit(80),
      db
        .select({ num: declarationContainers.containerNumber })
        .from(declarationContainers)
        .where(eq(declarationContainers.organizationId, orgId))
        .orderBy(desc(declarationContainers.sortOrder))
        .limit(120),
      db
        .select({ label: ledgerEntries.label })
        .from(ledgerEntries)
        .where(eq(ledgerEntries.organizationId, orgId))
        .orderBy(desc(ledgerEntries.createdAt))
        .limit(80),
      db
        .select({ title: dossiers.title })
        .from(dossiers)
        .where(
          and(
            eq(dossiers.organizationId, orgId),
            sql`${dossiers.title} is not null`,
          ),
        )
        .orderBy(desc(dossiers.updatedAt))
        .limit(40),
      listZones(db, ctx),
    ]);

  const prefixes: string[] = [];
  const suffixes: string[] = [];
  for (const row of declNumberRows) {
    const parts = parseDeclarationNumberParts(row.num);
    if (parts) {
      prefixes.push(parts.prefix);
      suffixes.push(parts.suffix);
    }
  }

  return {
    declarationPrefixes: uniqueNonEmpty(prefixes),
    declarationSuffixes: uniqueNonEmpty(suffixes),
    zoneCatalog: zones.map((z) => ({
      slug: z.slug,
      label: z.label,
    })),
    zoneOrTerminals: uniqueNonEmpty(zoneRows.map((r) => r.zone)),
    containerNumbers: uniqueNonEmpty(containerRows.map((r) => r.num)),
    ledgerLabels: uniqueNonEmpty(labelRows.map((r) => r.label)),
    dossierTitles: uniqueNonEmpty(titleRows.map((r) => r.title)),
  };
}

export async function getCustomerFormSuggestions(
  db: DbLike,
  ctx: ModuleContext,
  customerId: string,
): Promise<Pick<FormSuggestions, "ledgerLabels">> {
  const orgId = ctx.organizationId;

  const labelRows = await db
    .select({ label: ledgerEntries.label })
    .from(ledgerEntries)
    .where(
      and(
        eq(ledgerEntries.organizationId, orgId),
        eq(ledgerEntries.customerId, customerId),
      ),
    )
    .orderBy(desc(ledgerEntries.createdAt))
    .limit(50);

  return {
    ledgerLabels: uniqueNonEmpty(labelRows.map((r) => r.label)),
  };
}
