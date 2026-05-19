import { requireAuthContext } from "@/lib/auth/session";
import { PageHeader } from "@/components/shell/page-header";
import { NewClientButton } from "@/components/shell/page-actions";

export default async function ClientsPage() {
  await requireAuthContext();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Clients"
        description="Comptes clients et soldes — liste complète à venir (CLI-001)."
        actions={<NewClientButton />}
      />
    </div>
  );
}
