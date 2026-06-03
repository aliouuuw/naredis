"use client";

import { useState } from "react";
import { createCustomerAction } from "@/lib/actions/customers";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-feedback";
import { Input } from "@/components/ui/input";

export function NewCustomerForm({
  embedded = false,
  onSuccess,
  onCancel,
}: {
  embedded?: boolean;
  onSuccess?: (customerId: string) => void;
  onCancel?: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setSuccess(null);

    const form = new FormData(event.currentTarget);
    const result = await createCustomerAction({
      name: String(form.get("name") ?? ""),
      phone: String(form.get("phone") ?? "") || undefined,
      email: String(form.get("email") ?? "") || undefined,
      taxId: String(form.get("taxId") ?? "") || undefined,
      notes: String(form.get("notes") ?? "") || undefined,
    });

    setPending(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setSuccess("Client créé.");
    onSuccess?.(result.data!.id);
  }

  return (
    <form
      onSubmit={onSubmit}
      className={embedded ? "flex flex-col gap-5" : "flex max-w-lg flex-col gap-5"}
    >
      <div className="flex flex-col gap-2">
        <label htmlFor="name" className="text-sm font-medium">
          Nom du client <span className="text-destructive">*</span>
        </label>
        <Input id="name" name="name" required autoFocus={embedded} />
        <p className="text-xs text-muted-foreground">
          L&apos;identifiant (slug) sera généré automatiquement à partir du nom.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="phone" className="text-sm font-medium">
          Téléphone
        </label>
        <Input id="phone" name="phone" type="tel" />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <Input id="email" name="email" type="email" />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="taxId" className="text-sm font-medium">
          NINEA / identifiant fiscal
        </label>
        <Input id="taxId" name="taxId" />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="notes" className="text-sm font-medium">
          Notes
        </label>
        <Input id="notes" name="notes" />
      </div>
      {error ? <FormAlert variant="error">{error}</FormAlert> : null}
      {success ? <FormAlert variant="success">{success}</FormAlert> : null}
      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Création…" : "Créer le client"}
        </Button>
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
        ) : null}
      </div>
    </form>
  );
}
