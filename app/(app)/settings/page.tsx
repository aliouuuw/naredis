import { getDb } from "@/lib/db";
import { toModuleContext } from "@/lib/auth/module-context";
import {
  canMutateOperationalData,
  memberHasRole,
  LEDGER_MUTATION_ROLES,
} from "@/lib/auth/permissions";
import { requireAuthContext } from "@/lib/auth/session";
import { listAgencies } from "@/lib/modules/agencies/service";
import { listGaindeCardDebitTypes } from "@/lib/modules/gainde-cards/debit-types";
import { listTransactionTypes } from "@/lib/modules/ledger/transaction-types";
import { listZones } from "@/lib/modules/zones/service";
import { SettingsView } from "@/components/settings/settings-view";
import { PageHeader } from "@/components/shell/page-header";

export default async function SettingsPage() {
  const auth = await requireAuthContext();
  const ctx = toModuleContext(auth);
  const db = getDb();

  const [canEditOrg, canEditLedger, agencies, zones, gaindeCardDebitTypes, transactionTypes] =
    await Promise.all([
      canMutateOperationalData(auth.userId, auth.organizationId),
      memberHasRole(auth.userId, auth.organizationId, [...LEDGER_MUTATION_ROLES]),
      listAgencies(db, ctx, false),
      listZones(db, ctx, false),
      listGaindeCardDebitTypes(db, ctx, { activeOnly: false }),
      listTransactionTypes(db, ctx, { activeOnly: false }),
    ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Réglages"
        description="Catalogue du cabinet : cartes GAINDE, zones, types de débit carte et journal."
      />

      <SettingsView
        agencies={agencies.map((a) => ({
          id: a.id,
          name: a.name,
          notes: a.notes,
          isActive: a.isActive,
        }))}
        zones={zones}
        gaindeCardDebitTypes={gaindeCardDebitTypes}
        transactionTypes={transactionTypes}
        canEditOrg={canEditOrg}
        canEditLedger={canEditLedger}
      />
    </div>
  );
}
