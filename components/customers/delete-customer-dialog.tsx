"use client";

import { useState } from "react";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-feedback";
import { deleteCustomerAction } from "@/lib/actions/customers";
import type { CustomerListItemSerialized } from "@/lib/modules/customers/serialize-list";

export function DeleteCustomerDialog({
  customer,
  open,
  onOpenChange,
  onDeleted,
}: {
  customer: CustomerListItemSerialized;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setPending(true);
    setError(null);

    const result = await deleteCustomerAction(customer.id);
    setPending(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    onDeleted?.();
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!pending) onOpenChange(next);
      }}
    >
      <DialogContent className="flex w-[calc(100%-2rem)] max-w-md flex-col gap-0 p-0">
        <DialogHeader>
          <DialogTitle>Supprimer le client</DialogTitle>
          <DialogDescription>
            Cette action est irréversible. Le client et ses données seront
            désactivés.
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-4">
          <p className="text-sm">
            Voulez-vous vraiment supprimer{" "}
            <span className="font-semibold">{customer.name}</span> ?
          </p>
          {error ? <FormAlert variant="error">{error}</FormAlert> : null}
          <div className="flex gap-3">
            <Button
              variant="destructive"
              disabled={pending}
              onClick={handleDelete}
            >
              {pending ? "Suppression…" : "Supprimer"}
            </Button>
            <Button
              variant="outline"
              disabled={pending}
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
