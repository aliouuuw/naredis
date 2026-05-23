"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createCustomerAction } from "@/lib/actions/customers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function NewCustomerForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

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

    router.push(`/clients/${result.data!.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-lg flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label htmlFor="name" className="text-sm font-medium">
          Nom du client <span className="text-destructive">*</span>
        </label>
        <Input id="name" name="name" required autoFocus />
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
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Création…" : "Créer le client"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Annuler
        </Button>
      </div>
    </form>
  );
}
