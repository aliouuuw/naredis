import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { organizationMembers } from "@/lib/db/schema";

export async function getAppOrganizationIdForUser(
  userId: string,
): Promise<string | null> {
  const db = getDb();
  const [row] = await db
    .select({ organizationId: organizationMembers.organizationId })
    .from(organizationMembers)
    .where(eq(organizationMembers.userId, userId))
    .limit(1);
  return row?.organizationId ?? null;
}
