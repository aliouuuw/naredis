"use client";

import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  NewDeclarationForm,
  type AgencyOption,
  type CustomerOption,
} from "./new-declaration-form";

export function NewDeclarationDialog({
  open,
  onOpenChange,
  customers,
  agencies,
  defaultCustomerId,
  onRequestNewClient,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customers: CustomerOption[];
  agencies: AgencyOption[];
  defaultCustomerId?: string;
  onRequestNewClient?: () => void;
  onCreated?: (declarationId: string) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(92vh,920px)] w-[calc(100%-2rem)] max-w-3xl flex-col gap-0 p-0">
        <DialogHeader>
          <DialogTitle>Nouvelle déclaration</DialogTitle>
          <DialogDescription>
            Une ligne par connaissement (BL) — crée un dossier et la déclaration
            associée.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <NewDeclarationForm
            key={open ? `new-${defaultCustomerId ?? "none"}` : "closed"}
            embedded
            customers={customers}
            agencies={agencies}
            defaultCustomerId={defaultCustomerId}
            onRequestNewClient={onRequestNewClient}
            onCancel={() => onOpenChange(false)}
            onSuccess={(declarationId) => {
              onCreated?.(declarationId);
              window.setTimeout(() => onOpenChange(false), 500);
            }}
          />
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
