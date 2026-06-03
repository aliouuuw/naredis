import { and, eq } from "drizzle-orm";
import type { DbLike } from "@/lib/db";
import { customers, organizationAgencies } from "@/lib/db/schema";

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

/** Postgres unique_violation */
export function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: string }).code === "23505"
  );
}
