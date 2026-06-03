"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { DossierAllocationOption } from "@/lib/modules/ledger/service";
import type { TransactionTypeSerialized } from "@/lib/modules/ledger/serialize";
import { RecordTransactionForm } from "./record-transaction-form";

export function RecordTransactionDialog({
  open,
  onOpenChange,
  customerId,
  customerName,
  dossiers,
  transactionTypes,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  customerName: string;
  dossiers: DossierAllocationOption[];
  transactionTypes: TransactionTypeSerialized[];
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(92vh,880px)] w-[calc(100%-2rem)] max-w-2xl flex-col gap-0 p-0">
        <DialogHeader>
          <DialogTitle>Nouvelle transaction</DialogTitle>
          <DialogDescription>
            Client : {customerName} — crédit ou débit selon le type choisi.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto px-6 pb-6">
          <RecordTransactionForm
            embedded
            customerId={customerId}
            customerName={customerName}
            dossiers={dossiers}
            transactionTypes={transactionTypes}
            onSuccess={() => onOpenChange(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
