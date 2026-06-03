"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CustomerAccountStatus } from "@/lib/db/enums";
import { updateCustomerAccountStatusAction } from "@/lib/actions/customers";
import { FormAlert } from "@/components/ui/form-feedback";

const options: { value: CustomerAccountStatus; label: string }[] = [
  { value: "a_jour", label: "À jour" },
  { value: "pas_a_jour", label: "Pas à jour" },
];

export function AccountStatusControl({
  customerId,
  value,
  canEdit,
}: {
  customerId: string;
  value: CustomerAccountStatus;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onChange(next: CustomerAccountStatus) {
    if (!canEdit || next === value || pending) return;
    setPending(true);
    setError(null);

    const result = await updateCustomerAccountStatusAction(customerId, next);
    setPending(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  if (!canEdit) {
    return (
      <span>
        {options.find((o) => o.value === value)?.label ?? value}
      </span>
    );
  }

  return (
    <div className="space-y-2">
      <select
        value={value}
        disabled={pending}
        onChange={(e) =>
          void onChange(e.target.value as CustomerAccountStatus)
        }
        className="h-8 w-full max-w-xs rounded-lg border border-input bg-background px-2.5 text-sm"
        aria-label="Statut compte"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <p className="text-xs text-muted-foreground">
        Indicateur manuel de réconciliation comptable (indépendant du solde).
      </p>
      {error ? <FormAlert variant="error">{error}</FormAlert> : null}
    </div>
  );
}
