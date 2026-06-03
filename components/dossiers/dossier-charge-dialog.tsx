"use client";

import { useMemo, useState } from "react";
import { useCustomerFormSuggestions } from "@/components/hooks/use-form-suggestions";
import { useRouter } from "next/navigation";
import { recordTransactionAction } from "@/lib/actions/ledger";
import { agencyCalendarDate } from "@/lib/domain/timezone";
import type { TransactionTypeSerialized } from "@/lib/modules/ledger/serialize";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormAlert } from "@/components/ui/form-feedback";
import { FormSelect } from "@/components/ui/form-select";
import { FormSuggestInput } from "@/components/ui/form-suggest-input";
import { Input } from "@/components/ui/input";

export function DossierChargeDialog({
  open,
  onOpenChange,
  customerId,
  customerName,
  dossierId,
  dossierNumber,
  transactionTypes,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  customerName: string;
  dossierId: string;
  dossierNumber: string;
  transactionTypes: TransactionTypeSerialized[];
}) {
  const router = useRouter();
  const customerSuggestions = useCustomerFormSuggestions(customerId, open);
  const [pending, setPending] = useState(false);
  const [label, setLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const today = agencyCalendarDate();

  const debitTypes = useMemo(
    () =>
      transactionTypes.filter(
        (t) =>
          t.balanceSide === "debit" &&
          t.systemKey !== "opening_balance" &&
          t.systemKey !== "reversal" &&
          t.active,
      ),
    [transactionTypes],
  );

  const defaultTypeId =
    debitTypes.find((t) => t.code === "charge")?.id ?? debitTypes[0]?.id ?? "";

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const amountRaw = String(form.get("amount") ?? "").replace(/\s/g, "");
    const transactionTypeId = String(form.get("transactionTypeId") ?? "");

    let amount: bigint;
    try {
      amount = BigInt(amountRaw);
      if (amount <= BigInt(0)) throw new Error();
    } catch {
      setPending(false);
      setError("Montant invalide.");
      return;
    }

    const result = await recordTransactionAction(customerId, {
      transactionTypeId,
      label: String(form.get("label") ?? "").trim(),
      amount,
      effectiveDate: String(form.get("effectiveDate") ?? today),
      notes: String(form.get("notes") ?? "").trim() || undefined,
      dossierId,
      allocations: [],
    });

    setPending(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter une charge</DialogTitle>
          <DialogDescription>
            Frais ou honoraires sur le dossier {dossierNumber} — compte{" "}
            {customerName}. Le solde client sera mis à jour (débit).
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          {debitTypes.length === 0 ? (
            <FormAlert variant="error">
              Aucun type de charge actif. Configurez les types dans Réglages.
            </FormAlert>
          ) : (
            <form onSubmit={onSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="charge-type" className="text-sm font-medium">
                  Type
                </label>
                <FormSelect
                  id="charge-type"
                  name="transactionTypeId"
                  defaultValue={defaultTypeId}
                  options={debitTypes.map((t) => ({
                    value: t.id,
                    label: t.name,
                  }))}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="charge-label" className="text-sm font-medium">
                  Libellé
                </label>
                <FormSuggestInput
                  id="charge-label"
                  name="label"
                  required
                  placeholder="Ex. Frais dossier"
                  value={label}
                  onValueChange={setLabel}
                  suggestions={
                    customerSuggestions?.ledgerLabels.map((l) => ({
                      value: l,
                      group: "Libellés utilisés",
                    })) ?? []
                  }
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label htmlFor="charge-amount" className="text-sm font-medium">
                    Montant (XOF)
                  </label>
                  <Input
                    id="charge-amount"
                    name="amount"
                    inputMode="numeric"
                    required
                    placeholder="0"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="charge-date" className="text-sm font-medium">
                    Date
                  </label>
                  <Input
                    id="charge-date"
                    name="effectiveDate"
                    type="date"
                    defaultValue={today}
                    required
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="charge-notes" className="text-sm font-medium">
                  Notes
                </label>
                <Input id="charge-notes" name="notes" />
              </div>
              {error ? <FormAlert variant="error">{error}</FormAlert> : null}
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={pending}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={pending}>
                  {pending ? "Enregistrement…" : "Enregistrer la charge"}
                </Button>
              </div>
            </form>
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
