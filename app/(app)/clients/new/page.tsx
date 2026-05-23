import { requireAuthContext } from "@/lib/auth/session";
import { PageHeader } from "@/components/shell/page-header";
import { NewCustomerForm } from "@/components/customers/new-customer-form";

export default async function NewClientPage() {
  await requireAuthContext();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Nouveau client"
        description="Ajoutez un compte client. Le solde sera géré via les transactions."
      />
      <NewCustomerForm />
    </div>
  );
}
