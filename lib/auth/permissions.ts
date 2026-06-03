import type { MemberRole } from "@/lib/db/enums";
import { getMemberRoleCached } from "./session";

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
  const role = await getMemberRoleCached(userId, organizationId);
  return Boolean(role && allowed.includes(role));
}

export async function canMutateOperationalData(
  userId: string,
  organizationId: string,
): Promise<boolean> {
  return memberHasRole(userId, organizationId, MUTATION_ROLES);
}
