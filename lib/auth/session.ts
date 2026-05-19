import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import type { MemberRole } from "@/lib/db/enums";
import { organizationMembers } from "@/lib/db/schema";
import { auth, type Session } from "./auth";
import { getAppOrganizationIdForUser } from "./sync-org";

export type AuthContext = {
  session: Session;
  userId: string;
  organizationId: string;
  activeOrganizationId: string | null;
};

export async function getSession(): Promise<Session | null> {
  return auth.api.getSession({
    headers: await headers(),
  });
}

export async function getAuthContext(): Promise<AuthContext | null> {
  const session = await getSession();
  if (!session) {
    return null;
  }

  const activeOrganizationId = session.session.activeOrganizationId ?? null;
  let organizationId =
    activeOrganizationId ??
    (await getAppOrganizationIdForUser(session.user.id));

  if (!organizationId) {
    return null;
  }

  return {
    session,
    userId: session.user.id,
    organizationId,
    activeOrganizationId,
  };
}

export async function requireAuthContext(): Promise<AuthContext> {
  const ctx = await getAuthContext();
  if (!ctx) {
    redirect("/login");
  }
  return ctx;
}

/** @deprecated Use requireAuthContext — kept for backlog naming */
export const requireOrg = requireAuthContext;

export async function requireRole(allowed: MemberRole[]): Promise<AuthContext> {
  const ctx = await requireAuthContext();
  const db = getDb();
  const [member] = await db
    .select({ role: organizationMembers.role })
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.userId, ctx.userId),
        eq(organizationMembers.organizationId, ctx.organizationId),
      ),
    )
    .limit(1);

  if (!member || !allowed.includes(member.role)) {
    throw new Error("Insufficient permissions");
  }
  return ctx;
}
