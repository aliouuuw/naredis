import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { toModuleContext } from "@/lib/auth/module-context";
import { canMutateOperationalData } from "@/lib/auth/permissions";
import { requireAuthContext } from "@/lib/auth/session";
import { getDossierHub } from "@/lib/modules/dossiers/hub";
import { serializeDossierHub } from "@/lib/modules/dossiers/serialize-hub";
import { DossierHubView } from "@/components/dossiers/dossier-hub-view";
import { PageHeader } from "@/components/shell/page-header";

const CASE_STATUS_LABELS: Record<string, string> = {
  open: "Ouvert",
  on_hold: "En attente",
  closed: "Clôturé",
};

export default async function DossierFichePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const auth = await requireAuthContext();
  const ctx = toModuleContext(auth);
  const db = getDb();

  const hub = await getDossierHub(db, ctx, id);
  if (!hub) {
    notFound();
  }

  const canClose = await canMutateOperationalData(
    auth.userId,
    auth.organizationId,
  );

  const serialized = serializeDossierHub(hub);
  const statusLabel =
    CASE_STATUS_LABELS[hub.dossier.caseStatus] ?? hub.dossier.caseStatus;

  return (
    <div className="space-y-8">
      <PageHeader
        title={hub.dossier.dossierNumber}
        description={`BL ${hub.dossier.blReference ?? "—"} · ${statusLabel} · ${hub.dossier.customer.name}`}
      />

      <DossierHubView hub={serialized} canClose={canClose} />
    </div>
  );
}
