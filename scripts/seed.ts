import { config } from "dotenv";
import { eq } from "drizzle-orm";
import {
  ensureDevAdmin,
  getDevAdminCredentials,
} from "../lib/auth/seed-dev-admin";
import { assertDevSeedAllowed } from "../lib/auth/seed-guard";
import { cleanupOrphanOrganizationMembers } from "../lib/db/cleanup-orphan-members";
import { closeDb, getDb } from "../lib/db";
import {
  activityLog,
  customers,
  declarationContainers,
  declarationEditLog,
  declarationSequences,
  declarations,
  documents,
  dossierSequences,
  dossiers,
  ledgerEntries,
  organizationAgencies,
  organizations,
  paymentAllocations,
} from "../lib/db/schema";
import { slugFromName } from "../lib/utils/slug";

config({ path: ".env.local" });
config({ path: ".env" });

async function main() {
  assertDevSeedAllowed();
  const db = getDb();
  await cleanupOrphanOrganizationMembers();

  const existing = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(eq(organizations.slug, "demo-transit"))
    .limit(1);

  if (existing.length > 0) {
    const admin = await ensureDevAdmin(existing[0].id);
    const { email, password } = getDevAdminCredentials();
    console.log("Seed already applied (demo-transit org exists).");
    console.log(`  Dev admin: ${admin.email}${admin.created ? " (created)" : ""}`);
    console.log(`  Login: ${email} / ${password}`);
    console.log("  Re-run on fresh DB after schema migration 0003.");
    return;
  }

  const [org] = await db
    .insert(organizations)
    .values({
      name: "Demo Transit Dakar",
      slug: "demo-transit",
    })
    .returning();

  const admin = await ensureDevAdmin(org.id);

  const insertedAgencies = await db
    .insert(organizationAgencies)
    .values([
      {
        organizationId: org.id,
        name: "Ndouckmane Transit Dakar",
        notes: "Carte GAINDE principale",
      },
      {
        organizationId: org.id,
        name: "Ndouckmane Transit Rufisque",
      },
    ])
    .returning();

  const [agencyDakar] = insertedAgencies;

  const seedYear = 2026;
  await db.insert(dossierSequences).values({
    organizationId: org.id,
    year: seedYear,
    lastValue: 4,
  });
  await db.insert(declarationSequences).values({
    organizationId: org.id,
    year: seedYear,
    lastValue: 4,
  });

  const insertedCustomers = await db
    .insert(customers)
    .values([
      {
        organizationId: org.id,
        name: "Société Import Sénégal",
        slug: slugFromName("Société Import Sénégal"),
        code: "SIS",
        email: "compta@sis.sn",
        phone: "+221 77 000 00 01",
        accountStatus: "a_jour",
      },
      {
        organizationId: org.id,
        name: "Global Trade Afrique",
        slug: slugFromName("Global Trade Afrique"),
        code: "GTA",
        phone: "+221 77 000 00 02",
        accountStatus: "pas_a_jour",
      },
      {
        organizationId: org.id,
        name: "Marchés du Sahel",
        slug: slugFromName("Marchés du Sahel"),
        code: "MDS",
        taxId: "123456789",
        accountStatus: "pas_a_jour",
      },
    ])
    .returning();

  const [c1, c2, c3] = insertedCustomers;

  const insertedDossiers = await db
    .insert(dossiers)
    .values([
      {
        organizationId: org.id,
        customerId: c1.id,
        dossierNumber: "D-2026-0001",
        dossierType: "import",
        title: "Conteneur 40' pièces auto",
        blReference: "BL-SN-24001",
        containerReference: "MSCU1234567",
      },
      {
        organizationId: org.id,
        customerId: c2.id,
        dossierNumber: "D-2026-0002",
        dossierType: "import",
        blReference: "BL-SN-24002",
      },
      {
        organizationId: org.id,
        customerId: c1.id,
        dossierNumber: "D-2026-0003",
        dossierType: "transit",
        title: "Transit UEMOA",
        blReference: "BL-SN-24003",
      },
      {
        organizationId: org.id,
        customerId: c3.id,
        dossierNumber: "D-2026-0004",
        dossierType: "export",
        blReference: "BL-SN-24004",
      },
    ])
    .returning();

  const [d1, d2, d3, d4] = insertedDossiers;

  const insertedDeclarations = await db
    .insert(declarations)
    .values([
      {
        organizationId: org.id,
        dossierId: d1.id,
        declarationNumber: "DEC-2026-0001",
        zoneOrTerminal: "Zone portuaire — Dakar",
        declarationDate: "2026-04-01",
        containerCount: 1,
        clientAmountPaid: BigInt(200_000),
        gaindeDutyAmount: BigInt(1_450_000),
        costPrice: BigInt(1_620_000),
        payingAgencyId: agencyDakar.id,
        kind: "initial",
        status: "under_review",
        customsReference: "SYD-2026-001",
        bureau: "Port de Dakar",
        openedAt: new Date("2026-04-01"),
      },
      {
        organizationId: org.id,
        dossierId: d2.id,
        declarationNumber: "DEC-2026-0002",
        zoneOrTerminal: "Aéroport Blaise Diagne",
        declarationDate: "2026-04-10",
        containerCount: 0,
        clientAmountPaid: BigInt(0),
        gaindeDutyAmount: BigInt(320_000),
        costPrice: BigInt(380_000),
        kind: "initial",
        status: "submitted",
        bureau: "Aéroport Blaise Diagne",
        openedAt: new Date("2026-04-10"),
      },
      {
        organizationId: org.id,
        dossierId: d3.id,
        declarationNumber: "DEC-2026-0003",
        zoneOrTerminal: "Rufisque",
        declarationDate: "2026-03-15",
        containerCount: 2,
        clientAmountPaid: BigInt(500_000),
        gaindeDutyAmount: BigInt(890_000),
        costPrice: BigInt(1_100_000),
        payingAgencyId: agencyDakar.id,
        bonADelivrer: true,
        bonADelivrerAt: new Date("2026-04-02"),
        kind: "initial",
        status: "cleared",
        customsReference: "SYD-2026-003A",
        openedAt: new Date("2026-03-15"),
        closedAt: new Date("2026-04-01"),
      },
      {
        organizationId: org.id,
        dossierId: d4.id,
        declarationNumber: "DEC-2026-0004",
        zoneOrTerminal: "Zone franche",
        declarationDate: "2026-05-05",
        containerCount: 1,
        kind: "initial",
        status: "documents_pending",
        openedAt: new Date("2026-05-05"),
      },
    ])
    .returning();

  const [dec1, , dec3] = insertedDeclarations;

  await db.insert(declarationContainers).values([
    {
      organizationId: org.id,
      declarationId: dec1.id,
      containerNumber: "MSCU1234567",
      sortOrder: 0,
    },
    {
      organizationId: org.id,
      declarationId: dec3.id,
      containerNumber: "MSCU7654321",
      sortOrder: 0,
    },
    {
      organizationId: org.id,
      declarationId: dec3.id,
      containerNumber: "MSCU7654322",
      sortOrder: 1,
    },
  ]);

  await db.insert(declarationEditLog).values({
    organizationId: org.id,
    declarationId: dec3.id,
    changedBy: admin.userId,
    changes: {
      gainde_duty_amount: { from: "850000", to: "890000" },
      cost_price: { from: "1050000", to: "1100000" },
    },
  });

  await db.insert(documents).values([
    {
      organizationId: org.id,
      dossierId: d1.id,
      documentType: "bill_of_lading",
      storageKey: "demo/d1/bl.pdf",
      fileName: "BL-SN-24001.pdf",
      mimeType: "application/pdf",
      sizeBytes: BigInt(245_000),
      source: "client",
    },
    {
      organizationId: org.id,
      dossierId: d1.id,
      declarationId: dec1.id,
      documentType: "customs_declaration",
      storageKey: "demo/d1/declaration.pdf",
      fileName: "declaration-brouillon.pdf",
      mimeType: "application/pdf",
      source: "agent",
    },
  ]);

  const [openingBalance] = await db
    .insert(ledgerEntries)
    .values({
      organizationId: org.id,
      customerId: c1.id,
      entryType: "opening_balance",
      balanceSide: "debit",
      amount: BigInt(150_000),
      label: "Solde d'ouverture",
      effectiveDate: "2026-01-01",
      createdBy: admin.userId,
    })
    .returning();

  const [charge] = await db
    .insert(ledgerEntries)
    .values({
      organizationId: org.id,
      customerId: c1.id,
      dossierId: d1.id,
      declarationId: dec1.id,
      entryType: "charge",
      balanceSide: "debit",
      category: "honoraires",
      amount: BigInt(75_000),
      label: "Honoraires dédouanement",
      effectiveDate: "2026-04-15",
      createdBy: admin.userId,
    })
    .returning();

  const [versement] = await db
    .insert(ledgerEntries)
    .values({
      organizationId: org.id,
      customerId: c1.id,
      entryType: "versement",
      balanceSide: "credit",
      amount: BigInt(100_000),
      label: "Virement client",
      notes: "Acompte BL-SN-24001",
      effectiveDate: "2026-04-20",
      createdBy: admin.userId,
    })
    .returning();

  await db.insert(paymentAllocations).values({
    organizationId: org.id,
    ledgerEntryId: versement.id,
    dossierId: d1.id,
    amount: BigInt(50_000),
  });

  await db.insert(activityLog).values([
    {
      organizationId: org.id,
      entityType: "customer",
      entityId: c1.id,
      action: "customer.created",
      payload: { name: c1.name, slug: c1.slug },
      actorId: admin.userId,
    },
    {
      organizationId: org.id,
      entityType: "declaration",
      entityId: dec3.id,
      action: "declaration.updated",
      payload: { source: "declaration_edit_log" },
      actorId: admin.userId,
    },
    {
      organizationId: org.id,
      entityType: "ledger_entry",
      entityId: charge.id,
      action: "ledger.charge_recorded",
      payload: { amount: 75_000, dossierId: d1.id, balanceSide: "debit" },
      actorId: admin.userId,
    },
    {
      organizationId: org.id,
      entityType: "ledger_entry",
      entityId: versement.id,
      action: "ledger.versement_recorded",
      payload: { amount: 100_000, balanceSide: "credit" },
      actorId: admin.userId,
    },
    {
      organizationId: org.id,
      entityType: "ledger_entry",
      entityId: openingBalance.id,
      action: "ledger.opening_balance_recorded",
      payload: { amount: 150_000, balanceSide: "debit" },
      actorId: admin.userId,
    },
  ]);

  const { email, password } = getDevAdminCredentials();
  console.log("Seed complete:");
  console.log(`  Organization: ${org.name} (${org.slug})`);
  console.log(`  Agencies: ${insertedAgencies.length}`);
  console.log(`  Customers: ${insertedCustomers.length}`);
  console.log(`  Dossiers: ${insertedDossiers.length}`);
  console.log(`  Declarations: ${insertedDeclarations.length} (1 per BL)`);
  console.log(`  Dev admin: ${email} / ${password}`);
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
