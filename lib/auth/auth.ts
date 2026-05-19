import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { organization } from "better-auth/plugins";
import { getDb } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { syncMemberToApp, syncOrganizationToApp } from "./sync-org";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(getDb(), {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  plugins: [
    organization({
      organizationHooks: {
        afterCreateOrganization: async ({ organization, member }) => {
          await syncOrganizationToApp({
            id: organization.id,
            name: organization.name,
            slug: organization.slug,
          });
          if (member) {
            await syncMemberToApp({
              userId: member.userId,
              organizationId: member.organizationId,
              role: member.role,
            });
          }
        },
        afterAddMember: async ({ member }) => {
          await syncMemberToApp({
            userId: member.userId,
            organizationId: member.organizationId,
            role: member.role,
          });
        },
      },
    }),
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
