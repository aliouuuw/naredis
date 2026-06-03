import { eq } from "drizzle-orm";
import type { Db } from "@/lib/db";
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
  ledgerTransactionTypes,
  organizationAgencies,
  organizations,
  paymentAllocations,
} from "@/lib/db/schema";
import { ensureDefaultTransactionTypes } from "@/lib/modules/ledger/transaction-types";
import { slugFromName } from "@/lib/utils/slug";

export const DEMO_ORG_SLUG = "demo-transit";

export async function demoOrgExists(db: Db): Promise<string | null> {
  const [row] = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(eq(organizations.slug, DEMO_ORG_SLUG))
    .limit(1);
  return row?.id ?? null;
}

export async function createDemoOrg(db: Db): Promise<{
  orgId: string;
  orgName: string;
}> {
  const [org] = await db
    .insert(organizations)
    .values({
      name: "Ndouckmane Transit — Pilote",
      slug: DEMO_ORG_SLUG,
    })
    .returning();
  return { orgId: org.id, orgName: org.name };
}

/** Pilot-shaped demo data (see docs/13-pilot-operations.md). */
export async function seedDemoTransitData(
  db: Db,
  orgId: string,
  adminUserId: string,
): Promise<void> {
  await ensureDefaultTransactionTypes(db, orgId);
  const typeRows = await db
    .select()
    .from(ledgerTransactionTypes)
    .where(eq(ledgerTransactionTypes.organizationId, orgId));
  const typeIdByCode = Object.fromEntries(
    typeRows.map((t) => [t.code, t.id]),
  ) as Record<string, string>;

  const insertedAgencies = await db
    .insert(organizationAgencies)
    .values([
      {
        organizationId: orgId,
        name: "Ndouckmane Transit Dakar",
        notes: "Carte GAINDE principale",
      },
      {
        organizationId: orgId,
        name: "Ndouckmane Transit Rufisque",
      },
    ])
    .returning();

  const [agencyDakar] = insertedAgencies;

  const seedYear = 2026;
  await db.insert(dossierSequences).values({
    organizationId: orgId,
    year: seedYear,
    lastValue: 4,
  });
  await db.insert(declarationSequences).values({
    organizationId: orgId,
    year: seedYear,
    lastValue: 0,
  });

  const insertedCustomers = await db
    .insert(customers)
    .values([
      {
        organizationId: orgId,
        name: "Société Import Sénégal",
        slug: slugFromName("Société Import Sénégal"),
        code: "SIS",
        email: "compta@sis.sn",
        phone: "+221 77 000 00 01",
        accountStatus: "a_jour",
      },
      {
        organizationId: orgId,
        name: "Global Trade Afrique",
        slug: slugFromName("Global Trade Afrique"),
        code: "GTA",
        phone: "+221 77 000 00 02",
        accountStatus: "pas_a_jour",
      },
      {
        organizationId: orgId,
        name: "Marchés du Sahel",
        slug: slugFromName("Marchés du Sahel"),
        code: "MDS",
        taxId: "123456789",
        phone: "+221 77 000 00 03",
        accountStatus: "pas_a_jour",
      },
    ])
    .returning();

  const [cSis, cGta, cMds] = insertedCustomers;

  const insertedDossiers = await db
    .insert(dossiers)
    .values([
      {
        organizationId: orgId,
        customerId: cSis.id,
        dossierNumber: "D-2026-0001",
        dossierType: "import",
        title: "Pièces auto — conteneur 40'",
        blReference: "BL-SN-24001",
        containerReference: "MSCU1234567",
      },
      {
        organizationId: orgId,
        customerId: cGta.id,
        dossierNumber: "D-2026-0002",
        dossierType: "import",
        blReference: "BL-SN-24002",
      },
      {
        organizationId: orgId,
        customerId: cSis.id,
        dossierNumber: "D-2026-0003",
        dossierType: "import",
        title: "Transit UEMOA",
        blReference: "BL-SN-24003",
      },
      {
        organizationId: orgId,
        customerId: cMds.id,
        dossierNumber: "D-2026-0004",
        dossierType: "import",
        blReference: "BL-SN-24004",
      },
    ])
    .returning();

  const [d1, d2, d3, d4] = insertedDossiers;

  const insertedDeclarations = await db
    .insert(declarations)
    .values([
      {
        organizationId: orgId,
        dossierId: d1.id,
        declarationNumber: "1-DPW-D001",
        zoneOrTerminal: "DPW",
        declarationDate: "2026-05-12",
        containerCount: 1,
        clientAmountPaid: BigInt(2_500_000),
        gaindeDutyAmount: BigInt(1_450_000),
        costPrice: BigInt(1_620_000),
        payingAgencyId: agencyDakar.id,
        kind: "initial",
        status: "draft",
        openedAt: new Date("2026-05-12"),
      },
      {
        organizationId: orgId,
        dossierId: d2.id,
        declarationNumber: "2-18N-D001",
        zoneOrTerminal: "18N",
        declarationDate: "2026-05-20",
        containerCount: 1,
        clientAmountPaid: BigInt(3_200_000),
        gaindeDutyAmount: BigInt(800_000),
        costPrice: BigInt(1_100_000),
        payingAgencyId: agencyDakar.id,
        bonADelivrer: true,
        bonADelivrerAt: new Date("2026-05-28"),
        kind: "initial",
        status: "draft",
        openedAt: new Date("2026-05-20"),
      },
      {
        organizationId: orgId,
        dossierId: d3.id,
        declarationNumber: "3-RUF-D002",
        zoneOrTerminal: "RUF",
        declarationDate: "2026-04-08",
        containerCount: 2,
        clientAmountPaid: BigInt(1_800_000),
        gaindeDutyAmount: BigInt(890_000),
        costPrice: BigInt(1_100_000),
        payingAgencyId: agencyDakar.id,
        bonADelivrer: true,
        bonADelivrerAt: new Date("2026-04-22"),
        kind: "initial",
        status: "draft",
        openedAt: new Date("2026-04-08"),
      },
      {
        organizationId: orgId,
        dossierId: d4.id,
        declarationNumber: "4-AIBD-D001",
        zoneOrTerminal: "AIBD",
        declarationDate: "2026-06-01",
        containerCount: 1,
        kind: "initial",
        status: "draft",
        openedAt: new Date("2026-06-01"),
      },
    ])
    .returning();

  const [dec1, dec2, dec3, dec4] = insertedDeclarations;

  await db.insert(declarationContainers).values([
    {
      organizationId: orgId,
      declarationId: dec1.id,
      containerNumber: "MSCU1234567",
      sortOrder: 0,
    },
    {
      organizationId: orgId,
      declarationId: dec2.id,
      containerNumber: "HLBU9876543",
      sortOrder: 0,
    },
    {
      organizationId: orgId,
      declarationId: dec3.id,
      containerNumber: "MSCU7654321",
      sortOrder: 0,
    },
    {
      organizationId: orgId,
      declarationId: dec3.id,
      containerNumber: "MSCU7654322",
      sortOrder: 1,
    },
  ]);

  await db.insert(declarationEditLog).values({
    organizationId: orgId,
    declarationId: dec3.id,
    changedBy: adminUserId,
    changes: {
      gainde_duty_amount: { from: "850000", to: "890000" },
      cost_price: { from: "1050000", to: "1100000" },
    },
  });

  await db.insert(documents).values([
    {
      organizationId: orgId,
      dossierId: d1.id,
      documentType: "bill_of_lading",
      storageKey: "demo/d1/bl.pdf",
      fileName: "BL-SN-24001.pdf",
      mimeType: "application/pdf",
      sizeBytes: BigInt(245_000),
      source: "client",
    },
  ]);

  const [openingSis] = await db
    .insert(ledgerEntries)
    .values({
      organizationId: orgId,
      customerId: cSis.id,
      transactionTypeId: typeIdByCode.opening_balance,
      entryType: "opening_balance",
      balanceSide: "debit",
      amount: BigInt(150_000),
      label: "Solde d'ouverture 2026",
      effectiveDate: "2026-01-01",
      createdBy: adminUserId,
    })
    .returning();

  const [chargeSis] = await db
    .insert(ledgerEntries)
    .values({
      organizationId: orgId,
      customerId: cSis.id,
      transactionTypeId: typeIdByCode.charge,
      dossierId: d1.id,
      declarationId: dec1.id,
      entryType: "charge",
      balanceSide: "debit",
      category: "honoraires",
      amount: BigInt(75_000),
      label: "Honoraires dédouanement",
      effectiveDate: "2026-05-15",
      createdBy: adminUserId,
    })
    .returning();

  const [versementSis] = await db
    .insert(ledgerEntries)
    .values({
      organizationId: orgId,
      customerId: cSis.id,
      transactionTypeId: typeIdByCode.versement,
      entryType: "versement",
      balanceSide: "credit",
      amount: BigInt(100_000),
      label: "Virement client",
      notes: "Acompte BL-SN-24001",
      effectiveDate: "2026-05-20",
      createdBy: adminUserId,
    })
    .returning();

  await db.insert(paymentAllocations).values({
    organizationId: orgId,
    ledgerEntryId: versementSis.id,
    dossierId: d1.id,
    amount: BigInt(50_000),
  });

  await db.insert(ledgerEntries).values({
    organizationId: orgId,
    customerId: cSis.id,
    transactionTypeId: typeIdByCode.versement,
    entryType: "versement",
    balanceSide: "credit",
    amount: BigInt(25_000),
    label: "Encaissement espèces",
    effectiveDate: "2026-06-03",
    createdBy: adminUserId,
  });

  const [versementGta1] = await db
    .insert(ledgerEntries)
    .values({
      organizationId: orgId,
      customerId: cGta.id,
      transactionTypeId: typeIdByCode.versement,
      dossierId: d2.id,
      entryType: "versement",
      balanceSide: "credit",
      amount: BigInt(2_500_000),
      label: "Virement — BL-SN-24002",
      effectiveDate: "2026-05-18",
      createdBy: adminUserId,
    })
    .returning();

  await db.insert(paymentAllocations).values({
    organizationId: orgId,
    ledgerEntryId: versementGta1.id,
    dossierId: d2.id,
    amount: BigInt(2_500_000),
  });

  await db.insert(ledgerEntries).values([
    {
      organizationId: orgId,
      customerId: cGta.id,
      transactionTypeId: typeIdByCode.versement,
      entryType: "versement",
      balanceSide: "credit",
      amount: BigInt(500_000),
      label: "Second versement",
      effectiveDate: "2026-06-01",
      createdBy: adminUserId,
    },
    {
      organizationId: orgId,
      customerId: cGta.id,
      transactionTypeId: typeIdByCode.charge,
      dossierId: d2.id,
      declarationId: dec2.id,
      entryType: "charge",
      balanceSide: "debit",
      category: "honoraires",
      amount: BigInt(410_000),
      label: "Frais dossier 2-18N-D001",
      effectiveDate: "2026-05-25",
      createdBy: adminUserId,
    },
    {
      organizationId: orgId,
      customerId: cGta.id,
      transactionTypeId: typeIdByCode.charge,
      entryType: "charge",
      balanceSide: "debit",
      amount: BigInt(500_000),
      label: "Frais administratifs",
      effectiveDate: "2026-05-28",
      createdBy: adminUserId,
    },
  ]);

  await db.insert(ledgerEntries).values({
    organizationId: orgId,
    customerId: cMds.id,
    transactionTypeId: typeIdByCode.charge,
    dossierId: d4.id,
    entryType: "charge",
    balanceSide: "debit",
    amount: BigInt(200_000),
    label: "Avance sur dossier",
    effectiveDate: "2026-05-10",
    createdBy: adminUserId,
  });

  await db.insert(ledgerEntries).values({
    organizationId: orgId,
    customerId: cSis.id,
    transactionTypeId: typeIdByCode.reversal,
    entryType: "reversal",
    balanceSide: "credit",
    amount: BigInt(25_000),
    label: "Contre-passation honoraires",
    notes: "Correction saisie",
    effectiveDate: "2026-05-22",
    reversesEntryId: chargeSis.id,
    createdBy: adminUserId,
  });

  await db.insert(activityLog).values([
    {
      organizationId: orgId,
      entityType: "customer",
      entityId: cSis.id,
      action: "customer.created",
      payload: { name: cSis.name, slug: cSis.slug },
      actorId: adminUserId,
    },
    {
      organizationId: orgId,
      entityType: "declaration",
      entityId: dec1.id,
      action: "declaration.created",
      payload: {
        declarationNumber: "1-DPW-D001",
        dossierId: d1.id,
        blReference: "BL-SN-24001",
      },
      actorId: adminUserId,
    },
    {
      organizationId: orgId,
      entityType: "declaration",
      entityId: dec3.id,
      action: "declaration.updated",
      payload: { source: "declaration_edit_log" },
      actorId: adminUserId,
    },
    {
      organizationId: orgId,
      entityType: "ledger_entry",
      entityId: versementGta1.id,
      action: "ledger.versement_recorded",
      payload: { amount: 2_500_000, balanceSide: "credit" },
      actorId: adminUserId,
    },
    {
      organizationId: orgId,
      entityType: "ledger_entry",
      entityId: openingSis.id,
      action: "ledger.opening_balance_recorded",
      payload: { amount: 150_000, balanceSide: "debit" },
      actorId: adminUserId,
    },
  ]);

}

export async function deleteDemoTransitOrg(db: Db): Promise<boolean> {
  const [row] = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(eq(organizations.slug, DEMO_ORG_SLUG))
    .limit(1);

  if (!row) return false;

  await db.delete(organizations).where(eq(organizations.id, row.id));
  return true;
}
