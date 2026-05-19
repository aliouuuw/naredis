import { requireAuthContext } from "@/lib/auth/session";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/shell/page-header";

export default async function NewClientPage() {
  await requireAuthContext();

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <PageHeader
        title="Nouveau client"
        description="Formulaire de création — à venir (CLI-001)."
      />
      <ButtonLink href="/clients" variant="outline">
        Retour aux clients
      </ButtonLink>
    </div>
  );
}
