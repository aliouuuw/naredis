import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { closeDb, getDb } from "../lib/db";
import {
  activityLog,
  customers,
  declarationSequences,
  declarations,
  documents,
  dossierSequences,
  dossiers,
  ledgerEntries,
  organizationMembers,
  organizations,
  paymentAllocations,
} from "../lib/db/schema";

config({ path: ".env.local" });
config({ path: ".env" });

async function main() {
  const db = getDb();

  const existing = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(eq(organizations.slug, "demo-transit"))
    .limit(1);

  if (existing.length > 0) {
    console.log("Seed already applied (demo-transit org exists). Skipping.");
    return;
  }

  const [org] = await db
    .insert(organizations)
    .values({
      name: "Demo Transit Dakar",
      slug: "demo-transit",
    })
    .returning();

  await db.insert(organizationMembers).values([
    {
      organizationId: org.id,
      userId: "seed-owner",
      role: "owner",
    },
    {
      organizationId: org.id,
      userId: "seed-operator",
      role: "operator",
    },
  ]);

  await db.insert(dossierSequences).values({
    organizationId: org.id,
    lastValue: 4,
  });
  await db.insert(declarationSequences).values({
    organizationId: org.id,
    lastValue: 6,
  });

  const insertedCustomers = await db
    .insert(customers)
    .values([
      {
        organizationId: org.id,
        name: "Société Import Sénégal",
        code: "SIS",
        email: "compta@sis.sn",
        phone: "+221 77 000 00 01",
      },
      {
        organizationId: org.id,
        name: "Global Trade Afrique",
        code: "GTA",
        phone: "+221 77 000 00 02",
      },
      {
        organizationId: org.id,
        name: "Marchés du Sahel",
        code: "MDS",
        taxId: "123456789",
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
        title: "Transit UEMOA — rectificative",
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
        kind: "initial",
        status: "submitted",
        bureau: "Aéroport Blaise Diagne",
        openedAt: new Date("2026-04-10"),
      },
      {
        organizationId: org.id,
        dossierId: d3.id,
        declarationNumber: "DEC-2026-0003",
        kind: "initial",
        status: "cleared",
        customsReference: "SYD-2026-003A",
        openedAt: new Date("2026-03-15"),
        closedAt: new Date("2026-04-01"),
      },
      {
        organizationId: org.id,
        dossierId: d3.id,
        declarationNumber: "DEC-2026-0004",
        kind: "rectification",
        status: "draft",
        title: "Rectificative mars",
        openedAt: new Date("2026-05-01"),
      },
      {
        organizationId: org.id,
        dossierId: d4.id,
        declarationNumber: "DEC-2026-0005",
        kind: "initial",
        status: "documents_pending",
        openedAt: new Date("2026-05-05"),
      },
      {
        organizationId: org.id,
        dossierId: d4.id,
        declarationNumber: "DEC-2026-0006",
        kind: "complement",
        status: "draft",
        title: "Complément pièces",
      },
    ])
    .returning();

  const [dec1] = insertedDeclarations;

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
      amount: BigInt(150_000),
      label: "Solde d'ouverture",
      effectiveDate: "2026-01-01",
      createdBy: "seed-owner",
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
      category: "honoraires",
      amount: BigInt(75_000),
      label: "Honoraires dédouanement",
      effectiveDate: "2026-04-15",
      createdBy: "seed-owner",
    })
    .returning();

  const [payment] = await db
    .insert(ledgerEntries)
    .values({
      organizationId: org.id,
      customerId: c1.id,
      entryType: "payment",
      amount: BigInt(100_000),
      label: "Virement client",
      effectiveDate: "2026-04-20",
      createdBy: "seed-owner",
    })
    .returning();

  await db.insert(paymentAllocations).values({
    organizationId: org.id,
    ledgerEntryId: payment.id,
    dossierId: d1.id,
    amount: BigInt(50_000),
  });

  await db.insert(activityLog).values([
    {
      organizationId: org.id,
      entityType: "customer",
      entityId: c1.id,
      action: "customer.created",
      payload: { name: c1.name },
      actorId: "seed-owner",
    },
    {
      organizationId: org.id,
      entityType: "declaration",
      entityId: dec1.id,
      action: "declaration.status_changed",
      payload: { from: "submitted", to: "under_review" },
      actorId: "seed-operator",
    },
    {
      organizationId: org.id,
      entityType: "ledger_entry",
      entityId: charge.id,
      action: "ledger.charge_recorded",
      payload: { amount: 75_000, dossierId: d1.id },
      actorId: "seed-owner",
    },
    {
      organizationId: org.id,
      entityType: "ledger_entry",
      entityId: openingBalance.id,
      action: "ledger.opening_balance_recorded",
      payload: { amount: 150_000 },
      actorId: "seed-owner",
    },
  ]);

  console.log("Seed complete:");
  console.log(`  Organization: ${org.name} (${org.slug})`);
  console.log(`  Customers: ${insertedCustomers.length}`);
  console.log(`  Dossiers: ${insertedDossiers.length}`);
  console.log(`  Declarations: ${insertedDeclarations.length}`);
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
