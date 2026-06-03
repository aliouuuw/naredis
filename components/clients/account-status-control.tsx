"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { CustomerAccountStatus } from "@/lib/db/enums";
import { updateCustomerAccountStatusAction } from "@/lib/actions/customers";
import { FormAlert } from "@/components/ui/form-feedback";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

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
  const [status, setStatus] = useState(value);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setStatus(value);
  }, [value]);

  const isAJour = status === "a_jour";

  async function onToggle(checked: boolean) {
    const next: CustomerAccountStatus = checked ? "a_jour" : "pas_a_jour";
    if (!canEdit || next === status || pending) return;

    const previous = status;
    setStatus(next);
    setPending(true);
    setError(null);

    const result = await updateCustomerAccountStatusAction(customerId, next);
    setPending(false);

    if (!result.ok) {
      setStatus(previous);
      setError(result.error);
      return;
    }
    router.refresh();
  }

  if (!canEdit) {
    return (
      <span
        className={cn(
          "text-sm font-medium",
          isAJour
            ? "text-emerald-700 dark:text-emerald-400"
            : "text-amber-700 dark:text-amber-400",
        )}
      >
        {isAJour ? "Comptes à jour" : "Comptes pas à jour"}
      </span>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        <Switch
          id={`account-status-${customerId}`}
          checked={isAJour}
          disabled={pending}
          onCheckedChange={(checked) => void onToggle(checked)}
          aria-label="Comptes à jour"
        />
        <label
          htmlFor={`account-status-${customerId}`}
          className={cn(
            "cursor-pointer text-sm font-medium select-none",
            isAJour
              ? "text-emerald-700 dark:text-emerald-400"
              : "text-amber-700 dark:text-amber-400",
            pending && "opacity-60",
          )}
        >
          {isAJour ? "Comptes à jour" : "Comptes pas à jour"}
        </label>
      </div>
      <p className="text-xs text-muted-foreground">
        Réconciliation manuelle — indépendant du solde calculé.
      </p>
      {error ? <FormAlert variant="error">{error}</FormAlert> : null}
    </div>
  );
}
