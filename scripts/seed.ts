import { config } from "dotenv";
import {
  ensureDevAdmin,
  getDevAdminCredentials,
} from "../lib/auth/seed-dev-admin";
import { assertDevSeedAllowed } from "../lib/auth/seed-guard";
import { cleanupOrphanOrganizationMembers } from "../lib/db/cleanup-orphan-members";
import { closeDb, getDb } from "../lib/db";
import {
  createDemoOrg,
  deleteDemoTransitOrg,
  demoOrgExists,
  DEMO_ORG_SLUG,
  seedDemoTransitData,
} from "../lib/seed/demo-transit";

config({ path: ".env.local" });
config({ path: ".env" });

const reset =
  process.argv.includes("--reset") || process.env.SEED_RESET === "1";

async function main() {
  assertDevSeedAllowed();
  const db = getDb();
  await cleanupOrphanOrganizationMembers();

  if (reset) {
    const removed = await deleteDemoTransitOrg(db);
    console.log(
      removed
        ? `Removed existing org (${DEMO_ORG_SLUG}).`
        : `No org to remove (${DEMO_ORG_SLUG}).`,
    );
  } else if (await demoOrgExists(db)) {
    const { email, password } = getDevAdminCredentials();
    console.log(
      `Seed already applied (org ${DEMO_ORG_SLUG} exists). Use:\n  bun run db:reseed`,
    );
    console.log(`  Login: ${email} / ${password}`);
    return;
  }

  const { orgId, orgName } = await createDemoOrg(db);
  const admin = await ensureDevAdmin(orgId);
  await seedDemoTransitData(db, orgId, admin.userId);

  const { email, password } = getDevAdminCredentials();
  console.log("Seed complete:");
  console.log(`  Organization: ${orgName} (${DEMO_ORG_SLUG})`);
  console.log(`  Declarations: pilot numbers (e.g. 1-DPW-D001, 2-18N-D001)`);
  console.log(`  Global Trade Afrique: solde crédit ~2 090 000 XOF`);
  console.log(`  Dev admin: ${email} / ${password}`);
  if (admin.created) {
    console.log("  (admin user created)");
  }
}

main()
  .then(async () => {
    await closeDb();
  })
  .catch(async (error) => {
    console.error(error);
    await closeDb();
    process.exit(1);
  });
