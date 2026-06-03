import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import type { MemberRole } from "@/lib/db/enums";
import { organizationMembers } from "@/lib/db/schema";

export const MUTATION_ROLES: MemberRole[] = ["owner", "admin", "operator"];

/** Roles allowed to record versements, charges, and ledger corrections. */
export const LEDGER_MUTATION_ROLES: MemberRole[] = [
  "owner",
  "admin",
  "accountant",
];

export async function memberHasRole(
  userId: string,
  organizationId: string,
  allowed: MemberRole[],
): Promise<boolean> {
  const db = getDb();
  const [member] = await db
    .select({ role: organizationMembers.role })
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.userId, userId),
        eq(organizationMembers.organizationId, organizationId),
      ),
    )
    .limit(1);

  return Boolean(member && allowed.includes(member.role));
}

export async function canMutateOperationalData(
  userId: string,
  organizationId: string,
): Promise<boolean> {
  return memberHasRole(userId, organizationId, MUTATION_ROLES);
}
