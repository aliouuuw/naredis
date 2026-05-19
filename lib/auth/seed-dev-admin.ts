import { generateId } from "@better-auth/core/utils/id";
import { hashPassword } from "better-auth/crypto";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { organizationMembers } from "@/lib/db/schema";
import { account, user } from "@/lib/db/schema/auth";

const DEV_ADMIN_EMAIL = (
  process.env.SEED_ADMIN_EMAIL ?? "admin@demo-transit.sn"
).toLowerCase();

const DEV_ADMIN_PASSWORD =
  process.env.SEED_ADMIN_PASSWORD ?? "DemoAdmin2026!";

const DEV_ADMIN_NAME = process.env.SEED_ADMIN_NAME ?? "Admin Demo";

export type DevAdminSeedResult = {
  userId: string;
  email: string;
  created: boolean;
};

/** Creates (or reuses) the local dev admin and links them to the app organization. */
export async function ensureDevAdmin(
  organizationId: string,
): Promise<DevAdminSeedResult> {
  const db = getDb();

  const [existingUser] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, DEV_ADMIN_EMAIL))
    .limit(1);

  const userId = existingUser?.id ?? generateId();
  const created = !existingUser;

  if (created) {
    const now = new Date();
    const passwordHash = await hashPassword(DEV_ADMIN_PASSWORD);

    await db.insert(user).values({
      id: userId,
      name: DEV_ADMIN_NAME,
      email: DEV_ADMIN_EMAIL,
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    });

    await db.insert(account).values({
      id: generateId(),
      accountId: userId,
      providerId: "credential",
      userId,
      password: passwordHash,
      createdAt: now,
      updatedAt: now,
    });
  }

  await db
    .insert(organizationMembers)
    .values({
      organizationId,
      userId,
      role: "owner",
    })
    .onConflictDoUpdate({
      target: [
        organizationMembers.organizationId,
        organizationMembers.userId,
      ],
      set: { role: "owner" },
    });

  return { userId, email: DEV_ADMIN_EMAIL, created };
}

export function getDevAdminCredentials() {
  return {
    email: DEV_ADMIN_EMAIL,
    password: DEV_ADMIN_PASSWORD,
  };
}
