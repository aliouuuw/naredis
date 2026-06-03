"use client";

import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { NewCustomerForm } from "./new-customer-form";

export function NewCustomerDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (customerId: string) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(92vh,720px)] w-[calc(100%-2rem)] max-w-lg flex-col gap-0 p-0">
        <DialogHeader>
          <DialogTitle>Nouveau client</DialogTitle>
          <DialogDescription>
            Ajoutez un compte client. Le solde sera géré via les transactions.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <NewCustomerForm
            key={open ? "new-customer" : "closed"}
            embedded
            onCancel={() => onOpenChange(false)}
            onSuccess={(customerId) => {
              onCreated?.(customerId);
              window.setTimeout(() => onOpenChange(false), 500);
            }}
          />
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
