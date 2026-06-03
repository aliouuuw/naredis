import { cache } from "react";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { forbidden, redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import type { MemberRole } from "@/lib/db/enums";
import { organizationMembers } from "@/lib/db/schema";
import { auth, type Session } from "./auth";
import { getAppOrganizationIdForUser } from "./org-context";

export type AuthContext = {
  session: Session;
  userId: string;
  organizationId: string;
  activeOrganizationId: string | null;
};

const getSessionCached = cache(async (): Promise<Session | null> => {
  return auth.api.getSession({
    headers: await headers(),
  });
});

const getOrganizationIdCached = cache(
  async (userId: string): Promise<string | null> => {
    return getAppOrganizationIdForUser(userId);
  },
);

export async function getSession(): Promise<Session | null> {
  return getSessionCached();
}

export async function getAuthContext(): Promise<AuthContext | null> {
  const session = await getSessionCached();
  if (!session) {
    return null;
  }

  const organizationId = await getOrganizationIdCached(session.user.id);

  if (!organizationId) {
    return null;
  }

  return {
    session,
    userId: session.user.id,
    organizationId,
    activeOrganizationId: null,
  };
}

export async function requireAuthContext(): Promise<AuthContext> {
  const ctx = await getAuthContext();
  if (!ctx) {
    const session = await getSessionCached();
    if (!session) {
      redirect("/login");
    }
    await auth.api.signOut({ headers: await headers() });
    redirect("/login?error=no_organization");
  }

  return ctx;
}

/** @deprecated Use requireAuthContext — kept for backlog naming */
export const requireOrg = requireAuthContext;

const getMemberRoleCached = cache(
  async (
    userId: string,
    organizationId: string,
  ): Promise<MemberRole | null> => {
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
    return member?.role ?? null;
  },
);

export async function requireRole(allowed: MemberRole[]): Promise<AuthContext> {
  const ctx = await requireAuthContext();
  const role = await getMemberRoleCached(ctx.userId, ctx.organizationId);

  if (!role || !allowed.includes(role)) {
    forbidden();
  }
  return ctx;
}

export { getMemberRoleCached };
