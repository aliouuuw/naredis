/**
 * Import clients from Liste_des_clients.xlsx into the database.
 *
 * Usage:
 *   bun run scripts/import-clients.ts --org <org-slug>
 *
 * The --org flag is required to target the right organization.
 */

import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { closeDb, getDb } from "../lib/db";
import { customers, organizations } from "../lib/db/schema";
import { slugFromName } from "../lib/utils/slug";

config({ path: ".env.local" });
config({ path: ".env" });

// ---------------------------------------------------------------------------
// Raw data extracted from Liste_des_clients.xlsx
// ---------------------------------------------------------------------------
const RAW_CLIENTS: { name: string; phone?: string }[] = [
  { name: "Abdou Karim Gueye", phone: "773028853" },
  { name: "Abdoulaye Gueye" },
  { name: "Ablaye Riz" },
  { name: "Aliou Diagne" },
  { name: "Aliou Diallo", phone: "772503058" },
  { name: "Aly Khalil" },
  { name: "Amadou Seck", phone: "762883535" },
  { name: "Amsa Diop", phone: "776456045" },
  { name: "Amsa Faye" },
  { name: "Ass Fall", phone: "781357469" },
  { name: "Bakary", phone: "778632532" },
  { name: "Bara DIOP MAFAL", phone: "773724936" },
  { name: "Baye Mbar Thiam", phone: "775127402" },
  { name: "Cheikh Mbacké Fall" },
  { name: "Cheikh Thiam", phone: "776419406" },
  { name: "Cheikh Tidiane Ka", phone: "777088832" },
  { name: "Dalid", phone: "776937126" },
  { name: "El Hadj Diop" },
  { name: "El Hadj Gueye Kaolack" },
  { name: "Fatou Cisse", phone: "775726610" },
  { name: "Gnilane Faye", phone: "772879917" },
  { name: "Ibou Gueye", phone: "777373931" },
  { name: "Ibrahima Mboup", phone: "776387408" },
  { name: "Jim Loum", phone: "778741441" },
  { name: "Kabongo", phone: "776385401" },
  { name: "Khadim Thiam", phone: "766296565" },
  { name: "LT SANGARE" },
  { name: "Madame Konate", phone: "776597992" },
  { name: "Madame Konte" },
  { name: "Mafall Sylla" },
  { name: "Magad Diouf", phone: "776928528" },
  { name: "Magou Thiam", phone: "774334116" },
  { name: "Mamadou Seye", phone: "784209464" },
  { name: "Mame Diarra Gueye", phone: "772797617" },
  { name: "Mame Mor Sylla" },
  { name: "Mansour Ndao" },
  { name: "Mapenda Cisse" },
  { name: "Matar Touré" },
  { name: "Mbathio Dramé" },
  { name: "Mbaye Dieng", phone: "776580284" },
  { name: "Mère Coumba Dramé" },
  { name: "Michelle Diouf" },
  { name: "Mme Sy" },
  { name: "Modou Khaly Gadiaga", phone: "781147753" },
  { name: "Modou Sarr" },
  { name: "Momar Niang" },
  { name: "Mor Fall", phone: "777818908" },
  { name: "Mor Talla Ba" },
  { name: "Mouhamed Oriba" },
  { name: "Mourtalla Gueye" },
  { name: "Cheikh Mbacké Thiam" },
  { name: "Noel" },
  { name: "Omar Diop" },
  { name: "Pa Kassé" },
  { name: "Ramzy", phone: "776381612" },
  { name: "Sakhir Sarr", phone: "774503732" },
  { name: "Sakhir Seck", phone: "773760335" },
  { name: "Saliou Gueye", phone: "776587208" },
  { name: "Serigne Cheikh Hakim", phone: "774093178" },
  { name: "Serigne Matar" },
  { name: "Souleymane Diagne", phone: "773407230" },
  { name: "Thié" },
  { name: "Tidiane Diallo" },
  { name: "Twelium" },
  { name: "Cheikh Gueye Grand Yoff", phone: "765696667" },
  { name: "Khadim Fall" },
  { name: "Youssoupha Diop" },
  { name: "Serigne Mbacké Diakhaté" },
  { name: "Cheikhouna Khouma" },
  { name: "Habib Gaye" },
  { name: "Cheikh Ahmadou Bamba Touré" },
  { name: "Oumy Djigo", phone: "776885370" },
  { name: "Aziz Ndiaye" },
  { name: "Awa Amar" },
  { name: "Serigne Saliou Niang" },
  { name: "Talla Fall", phone: "775119145" },
  { name: "Bada Ndiaye" },
  { name: "Diouf Douanier" },
  { name: "Alassane Diagne Fall" },
  { name: "Omar Seck", phone: "778052828" },
  { name: "Gora Ka", phone: "781024023" },
  { name: "Aly Salah", phone: "776399005" },
  { name: "Tapha Nogaye", phone: "775378523" },
  { name: "Samba Dieng" },
  { name: "Habib Sarr" },
  { name: "PANKAJ" },
  { name: "Dame Ndiaye" },
  { name: "Madame Mbacké" },
  { name: "Commandant Balde" },
  { name: "Cheikh Gueye" },
  { name: "Mbaye Narr" },
  { name: "Yang Chinois" },
  { name: "Ousmane Seck" },
  { name: "Ibrahima Thiam Cargo" },
  { name: "Thierno Mamour" },
  { name: "Mame Diarra Niang" },
  { name: "Mouhamed Touré" },
  { name: "Ameth Lo" },
  { name: "Pa Kané" },
  { name: "Omar Aidara" },
  { name: "Becaye Mbaye" },
  { name: "Omar Djiby Ba" },
  { name: "Yanda Gueye" },
  { name: "Bara Dieng" },
  { name: "Assane Seye" },
  { name: "Mame Mor Mbacké" },
  { name: "Sadou Diallo" },
  { name: "BAK" },
  { name: "Sakhewar" },
  { name: "Cheikh Tidiane Sall" },
  { name: "Ndeye Astou Mbacké" },
  { name: "Diop TMS" },
  { name: "Astou Ndiaye" },
  { name: "Mountaga Tall" },
  { name: "Lobath SY" },
  { name: "Mame Penda Mbengue" },
  { name: "Oumy Ndiaye" },
  { name: "Justin Camara" },
  { name: "Lieutenant Dia" },
  { name: "Fatou Diop" },
  { name: "Bijou Ngoné" },
  { name: "Thierno Ba" },
  { name: "Cheikh Ka Café" },
  { name: "Alioune Fall" },
  { name: "Madame Ndoye" },
  { name: "Ndiaga Niang" },
  { name: "Fallou Dieng" },
  { name: "Cheikh Kane" },
  { name: "Ablaye Gueye" },
  { name: "Oumar Ndiaye Dj" },
  { name: "Ndeye Marie Ndao" },
  { name: "Baba Gueye" },
  { name: "Assane Ndiaye" },
  { name: "Père Youm" },
  { name: "Sokhna Sall" },
  { name: "Babacar Sarr" },
  { name: "Babacar Diop" },
  { name: "Diodio" },
  { name: "Mbagnick Diouf" },
  { name: "Bintou Ndao" },
  { name: "Dame Djigal" },
  { name: "Boy Sauce" },
  { name: "DASK" },
];

// ---------------------------------------------------------------------------

async function main() {
  const orgSlugArg = process.argv.indexOf("--org");
  if (orgSlugArg === -1 || !process.argv[orgSlugArg + 1]) {
    console.error("Usage: bun run scripts/import-clients.ts --org <org-slug>");
    process.exit(1);
  }
  const orgSlug = process.argv[orgSlugArg + 1];

  const db = getDb();

  const [org] = await db
    .select({ id: organizations.id, name: organizations.name })
    .from(organizations)
    .where(eq(organizations.slug, orgSlug))
    .limit(1);

  if (!org) {
    console.error(`Organization not found: "${orgSlug}"`);
    process.exit(1);
  }

  console.log(`Importing into: ${org.name} (${orgSlug})`);

  // Fetch existing slugs to avoid conflicts
  const existing = await db
    .select({ slug: customers.slug })
    .from(customers)
    .where(eq(customers.organizationId, org.id));
  const existingSlugs = new Set(existing.map((r) => r.slug));

  const toInsert = [];
  const skipped = [];

  for (const client of RAW_CLIENTS) {
    const baseSlug = slugFromName(client.name);
    // Handle slug collisions with a numeric suffix
    let slug = baseSlug;
    let i = 2;
    while (existingSlugs.has(slug)) {
      slug = `${baseSlug}-${i++}`;
    }
    existingSlugs.add(slug);

    toInsert.push({
      organizationId: org.id,
      name: client.name,
      slug,
      phone: client.phone ?? null,
    });
  }

  if (toInsert.length === 0) {
    console.log("Nothing to import.");
    return;
  }

  // Insert in batches of 50
  const BATCH = 50;
  let inserted = 0;
  for (let i = 0; i < toInsert.length; i += BATCH) {
    const batch = toInsert.slice(i, i + BATCH);
    await db.insert(customers).values(batch).onConflictDoNothing();
    inserted += batch.length;
  }

  console.log(`Done — ${inserted} clients imported (${skipped.length} skipped).`);
}

main()
  .then(async () => { await closeDb(); })
  .catch(async (err) => { console.error(err); await closeDb(); process.exit(1); });
