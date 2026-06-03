import { and, eq } from "drizzle-orm";
import type { DbLike } from "@/lib/db";
import {
  customers,
  declarations,
  dossiers,
  organizationAgencies,
} from "@/lib/db/schema";

export class OrgScopeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrgScopeError";
  }
}

export async function assertCustomerInOrg(
  db: DbLike,
  organizationId: string,
  customerId: string,
): Promise<void> {
  const [row] = await db
    .select({ id: customers.id })
    .from(customers)
    .where(
      and(
        eq(customers.id, customerId),
        eq(customers.organizationId, organizationId),
      ),
    )
    .limit(1);

  if (!row) {
    throw new OrgScopeError("Client introuvable pour cette organisation.");
  }
}

export async function assertAgencyInOrg(
  db: DbLike,
  organizationId: string,
  agencyId: string | null | undefined,
): Promise<void> {
  if (!agencyId) return;

  const [row] = await db
    .select({ id: organizationAgencies.id })
    .from(organizationAgencies)
    .where(
      and(
        eq(organizationAgencies.id, agencyId),
        eq(organizationAgencies.organizationId, organizationId),
      ),
    )
    .limit(1);

  if (!row) {
    throw new OrgScopeError("Agence introuvable pour cette organisation.");
  }
}

export async function assertDossierInOrgForCustomer(
  db: DbLike,
  organizationId: string,
  dossierId: string,
  customerId: string,
): Promise<void> {
  const [row] = await db
    .select({ id: dossiers.id })
    .from(dossiers)
    .where(
      and(
        eq(dossiers.id, dossierId),
        eq(dossiers.organizationId, organizationId),
        eq(dossiers.customerId, customerId),
      ),
    )
    .limit(1);

  if (!row) {
    throw new OrgScopeError(
      "Dossier introuvable pour ce client et cette organisation.",
    );
  }
}

export async function assertDeclarationInOrgForCustomer(
  db: DbLike,
  organizationId: string,
  declarationId: string,
  customerId: string,
): Promise<{ dossierId: string }> {
  const [row] = await db
    .select({ id: declarations.id, dossierId: declarations.dossierId })
    .from(declarations)
    .innerJoin(dossiers, eq(declarations.dossierId, dossiers.id))
    .where(
      and(
        eq(declarations.id, declarationId),
        eq(declarations.organizationId, organizationId),
        eq(dossiers.customerId, customerId),
      ),
    )
    .limit(1);

  if (!row) {
    throw new OrgScopeError(
      "Déclaration introuvable pour ce client et cette organisation.",
    );
  }

  return { dossierId: row.dossierId };
}

/** Postgres unique_violation */
export function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: string }).code === "23505"
  );
}
