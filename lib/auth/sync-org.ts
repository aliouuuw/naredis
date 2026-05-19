import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import type { MemberRole } from "@/lib/db/enums";
import { organizationMembers, organizations } from "@/lib/db/schema";

function mapMemberRole(role: string): MemberRole {
  switch (role) {
    case "owner":
      return "owner";
    case "admin":
      return "admin";
    case "accountant":
      return "accountant";
    default:
      return "operator";
  }
}

export async function syncOrganizationToApp(org: {
  id: string;
  name: string;
  slug: string;
}) {
  const db = getDb();
  await db
    .insert(organizations)
    .values({
      id: org.id,
      name: org.name,
      slug: org.slug,
    })
    .onConflictDoUpdate({
      target: organizations.id,
      set: {
        name: org.name,
        slug: org.slug,
        updatedAt: new Date(),
      },
    });
}

export async function syncMemberToApp(member: {
  userId: string;
  organizationId: string;
  role: string;
}) {
  const db = getDb();
  await db
    .insert(organizationMembers)
    .values({
      organizationId: member.organizationId,
      userId: member.userId,
      role: mapMemberRole(member.role),
    })
    .onConflictDoUpdate({
      target: [
        organizationMembers.organizationId,
        organizationMembers.userId,
      ],
      set: {
        role: mapMemberRole(member.role),
      },
    });
}

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
