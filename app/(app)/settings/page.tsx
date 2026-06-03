import { getDb } from "@/lib/db";
import { toModuleContext } from "@/lib/auth/module-context";
import {
  canMutateOperationalData,
  memberHasRole,
  LEDGER_MUTATION_ROLES,
} from "@/lib/auth/permissions";
import { requireAuthContext } from "@/lib/auth/session";
import { listAgencies } from "@/lib/modules/agencies/service";
import { listTransactionTypes } from "@/lib/modules/ledger/transaction-types";
import { listZones } from "@/lib/modules/zones/service";
import { SettingsView } from "@/components/settings/settings-view";
import { PageHeader } from "@/components/shell/page-header";

export default async function SettingsPage() {
  const auth = await requireAuthContext();
  const ctx = toModuleContext(auth);
  const db = getDb();

  const [canEditOrg, canEditLedger] = await Promise.all([
    canMutateOperationalData(auth.userId, auth.organizationId),
    memberHasRole(auth.userId, auth.organizationId, [...LEDGER_MUTATION_ROLES]),
  ]);

  const [agencies, zones, transactionTypes] = await Promise.all([
    listAgencies(db, ctx, false),
    listZones(db, ctx, false),
    listTransactionTypes(db, ctx, { activeOnly: false }),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Réglages"
        description="Données réutilisables du cabinet : agences payeur, zones de déclaration et types d'écriture."
      />

      <SettingsView
        agencies={agencies.map((a) => ({
          id: a.id,
          name: a.name,
          notes: a.notes,
          isActive: a.isActive,
        }))}
        zones={zones}
        transactionTypes={transactionTypes}
        canEditOrg={canEditOrg}
        canEditLedger={canEditLedger}
      />
    </div>
  );
}
