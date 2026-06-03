import { Plus } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

export function NewDeclarationButton() {
  return (
    <ButtonLink href="/declarations/new" className="rounded-full px-4">
      <Plus className="size-4" />
      Nouvelle déclaration
    </ButtonLink>
  );
}

export function NewClientButton() {
  return (
    <ButtonLink href="/clients/new" variant="outline" className="rounded-full px-4">
      <Plus className="size-4" />
      Nouveau client
    </ButtonLink>
  );
}

export function RecordPaymentButton({ customerId }: { customerId: string }) {
  return (
    <ButtonLink
      href={`/clients/${customerId}?tab=transactions&record=1`}
      className="rounded-full px-4"
    >
      <Plus className="size-4" />
      Nouvelle transaction
    </ButtonLink>
  );
}

export function NewTransactionButton({
  customerId,
}: {
  customerId?: string;
}) {
  const href = customerId
    ? `/transactions?f=customer%3Aeq%3A${encodeURIComponent(customerId)}&preset=today&record=1`
    : "/transactions?preset=today&record=1";
  return (
    <ButtonLink href={href} className="rounded-full px-4">
      <Plus className="size-4" />
      Nouvelle transaction
    </ButtonLink>
  );
}
