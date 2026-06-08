import { and, asc, desc, eq, gte, lte } from "drizzle-orm";
import type { DbLike } from "@/lib/db";
import {
  customers,
  declarations,
  dossiers,
  gaindeCardDebits,
  gaindeCardDebitTypes,
  gaindeCardLoads,
} from "@/lib/db/schema";
import { normalizeZoneSlugForLookup } from "@/lib/domain/zone-slug";
import { listAgencies } from "@/lib/modules/agencies/service";
import { listZones } from "@/lib/modules/zones/service";
import type { ModuleContext } from "@/lib/modules/shared/types";
import { ensureDefaultGaindeCardDebitTypes } from "./debit-types";

export type GaindeCardLoadRow = {
  id: string;
  payingAgencyId: string;
  amount: bigint;
  effectiveDate: string;
  label: string | null;
  notes: string | null;
  createdAt: Date;
};

export type GaindeCardDebitRow = {
  id: string;
  payingAgencyId: string;
  debitTypeId: string;
  debitTypeName: string;
  amount: bigint;
  effectiveDate: string;
  label: string | null;
  notes: string | null;
  createdAt: Date;
};

export type CarteLedgerDeclarationRow = {
  id: string;
  declarationNumber: string;
  declarationDate: string | null;
  customerName: string;
  blReference: string | null;
  gaindeDutyAmount: bigint | null;
  clientAmountPaid: bigint | null;
  zoneOrTerminal: string | null;
};

export type CarteLedgerZoneRow = {
  zoneKey: string;
  zoneLabel: string;
  totalGainde: bigint;
  declarationCount: number;
  declarations: CarteLedgerDeclarationRow[];
};

export type CarteLedgerDebitTypeRow = {
  debitTypeId: string;
  debitTypeName: string;
  total: bigint;
  entryCount: number;
  entries: GaindeCardDebitRow[];
};

export type CarteLedgerSnapshot = {
  agencyId: string;
  agencyName: string;
  loads: GaindeCardLoadRow[];
  /** Règlements dans la période filtrée. */
  totalPayments: bigint;
  zoneRows: CarteLedgerZoneRow[];
  /** Droit GAINDE (déclarations) dans la période. */
  totalDeclarationDebits: bigint;
  debitTypeRows: CarteLedgerDebitTypeRow[];
  /** Débits manuels dans la période. */
  totalManualDebits: bigint;
  /** Tous débits (déclarations + manuels) dans la période. */
  totalDebits: bigint;
  /** Tous règlements jusqu'à date fin. */
  totalPaymentsCumulative: bigint;
  /** Tous droits déclarations jusqu'à date fin. */
  totalDeclarationDebitsCumulative: bigint;
  /** Tous débits manuels jusqu'à date fin. */
  totalManualDebitsCumulative: bigint;
  totalDebitsCumulative: bigint;
  balanceRemaining: bigint;
  dateFrom: string | null;
  dateTo: string | null;
};

function mapLoad(row: typeof gaindeCardLoads.$inferSelect): GaindeCardLoadRow {
  return {
    id: row.id,
    payingAgencyId: row.payingAgencyId,
    amount: row.amount,
    effectiveDate: row.effectiveDate,
    label: row.label,
    notes: row.notes,
    createdAt: row.createdAt,
  };
}

function mapDebit(row: {
  id: string;
  payingAgencyId: string;
  debitTypeId: string;
  amount: bigint;
  effectiveDate: string;
  label: string | null;
  notes: string | null;
  createdAt: Date;
  debitTypeName: string;
}): GaindeCardDebitRow {
  return {
    id: row.id,
    payingAgencyId: row.payingAgencyId,
    debitTypeId: row.debitTypeId,
    debitTypeName: row.debitTypeName,
    amount: row.amount,
    effectiveDate: row.effectiveDate,
    label: row.label,
    notes: row.notes,
    createdAt: row.createdAt,
  };
}

function mapDeclarationRow(row: {
  id: string;
  declarationNumber: string;
  declarationDate: string | null;
  customerName: string;
  blReference: string | null;
  gaindeDutyAmount: bigint | null;
  clientAmountPaid: bigint | null;
  zoneOrTerminal: string | null;
}): CarteLedgerDeclarationRow {
  return {
    id: row.id,
    declarationNumber: row.declarationNumber,
    declarationDate: row.declarationDate,
    customerName: row.customerName,
    blReference: row.blReference,
    gaindeDutyAmount: row.gaindeDutyAmount,
    clientAmountPaid: row.clientAmountPaid,
    zoneOrTerminal: row.zoneOrTerminal,
  };
}

export async function listCardPaymentsForAgency(
  db: DbLike,
  ctx: ModuleContext,
  payingAgencyId: string,
  options?: { dateFrom?: string; dateTo?: string },
): Promise<GaindeCardLoadRow[]> {
  const conditions = [
    eq(gaindeCardLoads.organizationId, ctx.organizationId),
    eq(gaindeCardLoads.payingAgencyId, payingAgencyId),
  ];

  if (options?.dateFrom) {
    conditions.push(gte(gaindeCardLoads.effectiveDate, options.dateFrom));
  }
  if (options?.dateTo) {
    conditions.push(lte(gaindeCardLoads.effectiveDate, options.dateTo));
  }

  const rows = await db
    .select()
    .from(gaindeCardLoads)
    .where(and(...conditions))
    .orderBy(
      asc(gaindeCardLoads.effectiveDate),
      desc(gaindeCardLoads.createdAt),
    );

  return rows.map(mapLoad);
}

/** @deprecated use listCardPaymentsForAgency */
export const listCardLoadsForAgency = listCardPaymentsForAgency;

export async function recordCardPayment(
  db: DbLike,
  ctx: ModuleContext,
  input: {
    payingAgencyId: string;
    amount: bigint;
    effectiveDate: string;
    label?: string;
    notes?: string;
  },
): Promise<GaindeCardLoadRow> {
  const [row] = await db
    .insert(gaindeCardLoads)
    .values({
      organizationId: ctx.organizationId,
      payingAgencyId: input.payingAgencyId,
      amount: input.amount,
      effectiveDate: input.effectiveDate,
      label: input.label?.trim() || null,
      notes: input.notes?.trim() || null,
      createdByUserId: ctx.userId ?? null,
    })
    .returning();

  if (!row) {
    throw new Error("Impossible d'enregistrer le règlement.");
  }

  return mapLoad(row);
}

/** @deprecated use recordCardPayment */
export const recordCardLoad = recordCardPayment;

export async function listCardDebitsForAgency(
  db: DbLike,
  ctx: ModuleContext,
  payingAgencyId: string,
  options?: { dateFrom?: string; dateTo?: string },
): Promise<GaindeCardDebitRow[]> {
  const conditions = [
    eq(gaindeCardDebits.organizationId, ctx.organizationId),
    eq(gaindeCardDebits.payingAgencyId, payingAgencyId),
  ];

  if (options?.dateFrom) {
    conditions.push(gte(gaindeCardDebits.effectiveDate, options.dateFrom));
  }
  if (options?.dateTo) {
    conditions.push(lte(gaindeCardDebits.effectiveDate, options.dateTo));
  }

  const rows = await db
    .select({
      id: gaindeCardDebits.id,
      payingAgencyId: gaindeCardDebits.payingAgencyId,
      debitTypeId: gaindeCardDebits.debitTypeId,
      amount: gaindeCardDebits.amount,
      effectiveDate: gaindeCardDebits.effectiveDate,
      label: gaindeCardDebits.label,
      notes: gaindeCardDebits.notes,
      createdAt: gaindeCardDebits.createdAt,
      debitTypeName: gaindeCardDebitTypes.name,
    })
    .from(gaindeCardDebits)
    .innerJoin(
      gaindeCardDebitTypes,
      eq(gaindeCardDebits.debitTypeId, gaindeCardDebitTypes.id),
    )
    .where(and(...conditions))
    .orderBy(
      asc(gaindeCardDebits.effectiveDate),
      desc(gaindeCardDebits.createdAt),
    );

  return rows.map(mapDebit);
}

export async function recordCardDebit(
  db: DbLike,
  ctx: ModuleContext,
  input: {
    payingAgencyId: string;
    debitTypeId: string;
    amount: bigint;
    effectiveDate: string;
    label?: string;
    notes?: string;
  },
): Promise<GaindeCardDebitRow> {
  await ensureDefaultGaindeCardDebitTypes(db, ctx.organizationId);

  const [row] = await db
    .insert(gaindeCardDebits)
    .values({
      organizationId: ctx.organizationId,
      payingAgencyId: input.payingAgencyId,
      debitTypeId: input.debitTypeId,
      amount: input.amount,
      effectiveDate: input.effectiveDate,
      label: input.label?.trim() || null,
      notes: input.notes?.trim() || null,
      createdByUserId: ctx.userId ?? null,
    })
    .returning({
      id: gaindeCardDebits.id,
      payingAgencyId: gaindeCardDebits.payingAgencyId,
      debitTypeId: gaindeCardDebits.debitTypeId,
      amount: gaindeCardDebits.amount,
      effectiveDate: gaindeCardDebits.effectiveDate,
      label: gaindeCardDebits.label,
      notes: gaindeCardDebits.notes,
      createdAt: gaindeCardDebits.createdAt,
    });

  if (!row) {
    throw new Error("Impossible d'enregistrer le débit.");
  }

  const [typeRow] = await db
    .select({ name: gaindeCardDebitTypes.name })
    .from(gaindeCardDebitTypes)
    .where(eq(gaindeCardDebitTypes.id, input.debitTypeId))
    .limit(1);

  return mapDebit({
    ...row,
    debitTypeName: typeRow?.name ?? "—",
  });
}

async function listDeclarationsForCard(
  db: DbLike,
  ctx: ModuleContext,
  payingAgencyId: string,
  options?: { dateFrom?: string; dateTo?: string },
): Promise<CarteLedgerDeclarationRow[]> {
  const conditions = [
    eq(declarations.organizationId, ctx.organizationId),
    eq(declarations.payingAgencyId, payingAgencyId),
  ];

  if (options?.dateFrom) {
    conditions.push(gte(declarations.declarationDate, options.dateFrom));
  }
  if (options?.dateTo) {
    conditions.push(lte(declarations.declarationDate, options.dateTo));
  }

  const rows = await db
    .select({
      id: declarations.id,
      declarationNumber: declarations.declarationNumber,
      declarationDate: declarations.declarationDate,
      gaindeDutyAmount: declarations.gaindeDutyAmount,
      clientAmountPaid: declarations.clientAmountPaid,
      zoneOrTerminal: declarations.zoneOrTerminal,
      customerName: customers.name,
      blReference: dossiers.blReference,
    })
    .from(declarations)
    .innerJoin(dossiers, eq(declarations.dossierId, dossiers.id))
    .innerJoin(customers, eq(dossiers.customerId, customers.id))
    .where(and(...conditions))
    .orderBy(
      desc(declarations.declarationDate),
      desc(declarations.declarationNumber),
    );

  return rows.map((r) =>
    mapDeclarationRow({
      ...r,
      declarationDate: r.declarationDate ?? null,
    }),
  );
}

function groupDebitsByType(
  debits: GaindeCardDebitRow[],
): CarteLedgerDebitTypeRow[] {
  const byType = new Map<string, CarteLedgerDebitTypeRow>();

  for (const entry of debits) {
    const existing = byType.get(entry.debitTypeId);
    if (existing) {
      existing.entries.push(entry);
      existing.entryCount += 1;
      existing.total += entry.amount;
    } else {
      byType.set(entry.debitTypeId, {
        debitTypeId: entry.debitTypeId,
        debitTypeName: entry.debitTypeName,
        total: entry.amount,
        entryCount: 1,
        entries: [entry],
      });
    }
  }

  return [...byType.values()].sort((a, b) =>
    a.debitTypeName.localeCompare(b.debitTypeName, "fr"),
  );
}

function sumDeclarationDuty(rows: CarteLedgerDeclarationRow[]): bigint {
  let total = BigInt(0);
  for (const d of rows) {
    if (d.gaindeDutyAmount != null) {
      total += d.gaindeDutyAmount;
    }
  }
  return total;
}

function sumDebitAmounts(rows: GaindeCardDebitRow[]): bigint {
  let total = BigInt(0);
  for (const row of rows) {
    total += row.amount;
  }
  return total;
}

export async function buildCarteLedger(
  db: DbLike,
  ctx: ModuleContext,
  payingAgencyId: string,
  options?: { dateFrom?: string; dateTo?: string },
): Promise<CarteLedgerSnapshot | null> {
  const agencies = await listAgencies(db, ctx, false);
  const agency = agencies.find((a) => a.id === payingAgencyId);
  if (!agency) return null;

  const [loads, declarationRows, manualDebits, zones] = await Promise.all([
    listCardPaymentsForAgency(db, ctx, payingAgencyId, options),
    listDeclarationsForCard(db, ctx, payingAgencyId, options),
    listCardDebitsForAgency(db, ctx, payingAgencyId, options),
    listZones(db, ctx, false),
  ]);

  let totalPayments = BigInt(0);
  for (const load of loads) {
    totalPayments += load.amount;
  }

  const zoneLabelByKey = new Map<string, string>();
  for (const z of zones) {
    const key = normalizeZoneSlugForLookup(z.slug);
    zoneLabelByKey.set(key, z.label);
  }

  const buckets = new Map<string, CarteLedgerDeclarationRow[]>();

  for (const decl of declarationRows) {
    const key = decl.zoneOrTerminal
      ? normalizeZoneSlugForLookup(decl.zoneOrTerminal)
      : "__none__";
    const list = buckets.get(key) ?? [];
    list.push(decl);
    buckets.set(key, list);
  }

  const zoneRows: CarteLedgerZoneRow[] = [...buckets.entries()]
    .map(([zoneKey, decls]) => {
      let totalGainde = BigInt(0);
      for (const d of decls) {
        if (d.gaindeDutyAmount != null) {
          totalGainde += d.gaindeDutyAmount;
        }
      }
      const zoneLabel =
        zoneKey === "__none__"
          ? "Sans zone"
          : (zoneLabelByKey.get(zoneKey) ?? zoneKey);

      decls.sort((a, b) => {
        const da = a.declarationDate ?? "";
        const db_ = b.declarationDate ?? "";
        return (
          db_.localeCompare(da) ||
          b.declarationNumber.localeCompare(a.declarationNumber)
        );
      });

      return {
        zoneKey,
        zoneLabel,
        totalGainde,
        declarationCount: decls.length,
        declarations: decls,
      };
    })
    .filter((row) => row.declarationCount > 0)
    .sort((a, b) => a.zoneLabel.localeCompare(b.zoneLabel, "fr"));

  const totalDeclarationDebits = sumDeclarationDuty(declarationRows);
  const totalManualDebits = sumDebitAmounts(manualDebits);
  const totalDebits = totalDeclarationDebits + totalManualDebits;
  const debitTypeRows = groupDebitsByType(manualDebits);

  const cumulativeEnd = options?.dateTo ?? undefined;
  const [allPaymentsThrough, allDeclarationsThrough, allManualDebitsThrough] =
    await Promise.all([
      listCardPaymentsForAgency(db, ctx, payingAgencyId, {
        dateTo: cumulativeEnd,
      }),
      listDeclarationsForCard(db, ctx, payingAgencyId, {
        dateTo: cumulativeEnd,
      }),
      listCardDebitsForAgency(db, ctx, payingAgencyId, {
        dateTo: cumulativeEnd,
      }),
    ]);

  let totalPaymentsCumulative = BigInt(0);
  for (const load of allPaymentsThrough) {
    totalPaymentsCumulative += load.amount;
  }

  const totalDeclarationDebitsCumulative = sumDeclarationDuty(
    allDeclarationsThrough,
  );
  const totalManualDebitsCumulative = sumDebitAmounts(allManualDebitsThrough);
  const totalDebitsCumulative =
    totalDeclarationDebitsCumulative + totalManualDebitsCumulative;

  return {
    agencyId: agency.id,
    agencyName: agency.name,
    loads,
    totalPayments,
    zoneRows,
    totalDeclarationDebits,
    debitTypeRows,
    totalManualDebits,
    totalDebits,
    totalPaymentsCumulative,
    totalDeclarationDebitsCumulative,
    totalManualDebitsCumulative,
    totalDebitsCumulative,
    balanceRemaining: totalPaymentsCumulative - totalDebitsCumulative,
    dateFrom: options?.dateFrom ?? null,
    dateTo: options?.dateTo ?? null,
  };
}
