"use client";

import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { DossierAllocationOption } from "@/lib/modules/ledger/service";
import type { TransactionTypeSerialized } from "@/lib/modules/ledger/serialize";
import { FormEntityPicker } from "@/components/ui/form-entity-picker";
import { RecordTransactionForm } from "./record-transaction-form";

type CustomerOption = { id: string; name: string };

export function RecordTransactionDialog({
  open,
  onOpenChange,
  customerId,
  customerName,
  dossiers,
  dossiersLoading = false,
  transactionTypes,
  needsCustomerPick = false,
  customers = [],
  pickCustomerId = "",
  onPickCustomerChange,
  customerLedgerLabels,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId?: string;
  customerName?: string;
  dossiers: DossierAllocationOption[];
  dossiersLoading?: boolean;
  transactionTypes: TransactionTypeSerialized[];
  needsCustomerPick?: boolean;
  customers?: CustomerOption[];
  pickCustomerId?: string;
  onPickCustomerChange?: (customerId: string) => void;
  customerLedgerLabels?: string[];
}) {
  const canSubmit = Boolean(customerId && customerName);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(92vh,880px)] w-[calc(100%-2rem)] max-w-2xl flex-col gap-0 p-0">
        <DialogHeader>
          <DialogTitle>Nouvelle transaction</DialogTitle>
          <DialogDescription>
            {canSubmit
              ? `Client : ${customerName} — crédit ou débit selon le type choisi.`
              : "Choisissez un client pour enregistrer une écriture."}
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          {needsCustomerPick && !canSubmit ? (
            <div className="mb-4 flex flex-col gap-2">
              <label htmlFor="pick-customer" className="text-sm font-medium">
                Client <span className="text-destructive">*</span>
              </label>
              <FormEntityPicker
                id="pick-customer"
                value={pickCustomerId}
                onValueChange={(id) => onPickCustomerChange?.(id)}
                placeholder="Rechercher un client…"
                options={customers.map((c) => ({
                  value: c.id,
                  label: c.name,
                }))}
              />
            </div>
          ) : null}

          {canSubmit ? (
            <RecordTransactionForm
              embedded
              customerId={customerId!}
              customerName={customerName!}
              dossiers={dossiers}
              dossiersLoading={dossiersLoading}
              transactionTypes={transactionTypes}
              customerLedgerLabels={customerLedgerLabels}
              onSuccess={() => onOpenChange(false)}
            />
          ) : needsCustomerPick ? (
            <p className="text-sm text-muted-foreground">
              Sélectionnez un client pour continuer.
            </p>
          ) : null}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
