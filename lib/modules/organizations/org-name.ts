import { eq } from "drizzle-orm";
import type { DbLike } from "@/lib/db";
import { organizations } from "@/lib/db/schema";

export async function getOrganizationName(
  db: DbLike,
  organizationId: string,
): Promise<string> {
  const [row] = await db
    .select({ name: organizations.name })
    .from(organizations)
    .where(eq(organizations.id, organizationId))
    .limit(1);
  return row?.name ?? "Organisation";
}
