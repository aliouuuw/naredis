import { notInArray } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { organizationMembers } from "@/lib/db/schema";
import { user } from "@/lib/db/schema/auth";

/** Remove app membership rows that reference deleted or never-created auth users. */
export async function cleanupOrphanOrganizationMembers() {
  const db = getDb();
  const validUsers = await db.select({ id: user.id }).from(user);
  const validIds = validUsers.map((row) => row.id);

  if (validIds.length === 0) {
    await db.delete(organizationMembers);
    return;
  }

  await db
    .delete(organizationMembers)
    .where(notInArray(organizationMembers.userId, validIds));
}
