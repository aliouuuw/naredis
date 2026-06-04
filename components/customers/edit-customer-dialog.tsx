"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormAlert } from "@/components/ui/form-feedback";
import {
  getCustomerAction,
  updateCustomerInfoAction,
} from "@/lib/actions/customers";
import type { CustomerListItemSerialized } from "@/lib/modules/customers/serialize-list";

type FullCustomer = NonNullable<Awaited<ReturnType<typeof getCustomerAction>>>;

export function EditCustomerDialog({
  customer,
  open,
  onOpenChange,
  onUpdated,
}: {
  customer: CustomerListItemSerialized;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
}) {
  const [full, setFull] = useState<FullCustomer | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setFull(null);
    setError(null);
    getCustomerAction(customer.id).then(setFull);
  }, [open, customer.id]);

  async function onSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const form = new FormData(event.currentTarget);

    const result = await updateCustomerInfoAction(customer.id, {
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

    onUpdated?.();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(92vh,640px)] w-[calc(100%-2rem)] max-w-lg flex-col gap-0 p-0">
        <DialogHeader>
          <DialogTitle>Modifier le client</DialogTitle>
          <DialogDescription>
            Modifiez les informations de {customer.name}.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          {full === null ? (
            <p className="text-sm text-muted-foreground">Chargement…</p>
          ) : (
            <form onSubmit={onSubmit} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label htmlFor="edit-name" className="text-sm font-medium">
                  Nom du client <span className="text-destructive">*</span>
                </label>
                <Input
                  id="edit-name"
                  name="name"
                  required
                  defaultValue={full.name}
                  autoFocus
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="edit-phone" className="text-sm font-medium">
                  Téléphone
                </label>
                <Input
                  id="edit-phone"
                  name="phone"
                  type="tel"
                  defaultValue={full.phone ?? ""}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="edit-email" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="edit-email"
                  name="email"
                  type="email"
                  defaultValue={full.email ?? ""}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="edit-taxId" className="text-sm font-medium">
                  NINEA / identifiant fiscal
                </label>
                <Input
                  id="edit-taxId"
                  name="taxId"
                  defaultValue={full.taxId ?? ""}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="edit-notes" className="text-sm font-medium">
                  Notes
                </label>
                <Input
                  id="edit-notes"
                  name="notes"
                  defaultValue={full.notes ?? ""}
                />
              </div>
              {error ? <FormAlert variant="error">{error}</FormAlert> : null}
              <div className="flex gap-3">
                <Button type="submit" disabled={pending}>
                  {pending ? "Enregistrement…" : "Enregistrer"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Annuler
                </Button>
              </div>
            </form>
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
