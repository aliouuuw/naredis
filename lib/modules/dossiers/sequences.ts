import { sql } from "drizzle-orm";
import type { DbLike } from "@/lib/db";
import {
  declarationSequences,
  dossierSequences,
} from "@/lib/db/schema";
import { agencyCalendarYear } from "@/lib/domain/timezone";

async function nextSequenceValue(
  db: DbLike,
  organizationId: string,
  table: typeof dossierSequences | typeof declarationSequences,
  prefix: "D" | "DEC",
): Promise<string> {
  const year = agencyCalendarYear();

  const [row] = await db
    .insert(table)
    .values({ organizationId, lastValue: 1 })
    .onConflictDoUpdate({
      target: table.organizationId,
      set: { lastValue: sql`${table.lastValue} + 1` },
    })
    .returning({ lastValue: table.lastValue });

  const seq = row?.lastValue ?? 1;
  return `${prefix}-${year}-${String(seq).padStart(4, "0")}`;
}

export function nextDossierNumber(db: DbLike, organizationId: string) {
  return nextSequenceValue(db, organizationId, dossierSequences, "D");
}

export function nextDeclarationNumber(db: DbLike, organizationId: string) {
  return nextSequenceValue(
    db,
    organizationId,
    declarationSequences,
    "DEC",
  );
}

/** Ensure sequence row exists (e.g. after manual seed). */
export async function ensureSequenceRows(db: DbLike, organizationId: string) {
  await db
    .insert(dossierSequences)
    .values({ organizationId, lastValue: 0 })
    .onConflictDoNothing();
  await db
    .insert(declarationSequences)
    .values({ organizationId, lastValue: 0 })
    .onConflictDoNothing();
}
