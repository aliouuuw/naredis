import { requireAuthContext } from "@/lib/auth/session";
import { PageHeader } from "@/components/shell/page-header";

export default async function SettingsPage() {
  await requireAuthContext();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Réglages"
        description="Cabinet et membres — à venir (POL-003)."
      />
    </div>
  );
}
