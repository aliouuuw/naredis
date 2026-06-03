"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { listDossiersForCustomerAction } from "@/lib/actions/transaction-types";
import type { TransactionTypeSerialized } from "@/lib/modules/ledger/serialize";
import type { DossierAllocationOption } from "@/lib/modules/ledger/service";
import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/ui/form-select";
import { RecordTransactionDialog } from "./record-transaction-dialog";

type CustomerOption = { id: string; name: string };

export function RecordTransactionLauncher({
  customers,
  transactionTypes,
  initialCustomerId,
  recordIntent = false,
  variant = "header",
}: {
  customers: CustomerOption[];
  transactionTypes: TransactionTypeSerialized[];
  initialCustomerId?: string;
  recordIntent?: boolean;
  /** header = primary CTA; inline = toolbar on transactions list */
  variant?: "header" | "inline";
}) {
  const [open, setOpen] = useState(false);
  const [pickCustomerId, setPickCustomerId] = useState(
    initialCustomerId ?? "",
  );
  const [dossiers, setDossiers] = useState<DossierAllocationOption[]>([]);
  const [dossiersLoading, setDossiersLoading] = useState(false);

  const resolvedCustomerId = initialCustomerId ?? pickCustomerId;
  const selectedCustomer = customers.find((c) => c.id === resolvedCustomerId);

  const loadDossiers = useCallback(async (customerId: string) => {
    setDossiersLoading(true);
    const result = await listDossiersForCustomerAction(customerId);
    setDossiersLoading(false);
    if (result.ok && result.data) {
      setDossiers(result.data);
    } else {
      setDossiers([]);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    if (initialCustomerId) {
      void loadDossiers(initialCustomerId);
      return;
    }
    if (pickCustomerId) {
      void loadDossiers(pickCustomerId);
    } else {
      setDossiers([]);
    }
  }, [open, initialCustomerId, pickCustomerId, loadDossiers]);

  useEffect(() => {
    if (recordIntent) {
      setOpen(true);
    }
  }, [recordIntent]);

  useEffect(() => {
    setPickCustomerId(initialCustomerId ?? "");
  }, [initialCustomerId]);

  const needsCustomerPick = !initialCustomerId;

  return (
    <>
      <Button
        type="button"
        className={variant === "header" ? "rounded-full px-4" : "rounded-full"}
        onClick={() => setOpen(true)}
      >
        <Plus className="size-4" />
        Nouvelle transaction
      </Button>

      <RecordTransactionDialog
        open={open}
        onOpenChange={setOpen}
        customerId={selectedCustomer?.id}
        customerName={selectedCustomer?.name}
        dossiers={dossiers}
        dossiersLoading={dossiersLoading}
        transactionTypes={transactionTypes}
        needsCustomerPick={needsCustomerPick}
        customers={customers}
        pickCustomerId={pickCustomerId}
        onPickCustomerChange={(id) => {
          setPickCustomerId(id);
          if (id) void loadDossiers(id);
        }}
      />
    </>
  );
}
