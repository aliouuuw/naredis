"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { recordCardDebitAction } from "@/lib/actions/gainde-cards";
import { agencyCalendarDate } from "@/lib/domain/timezone";
import type { GaindeCardDebitTypeRow } from "@/lib/modules/gainde-cards/debit-types";
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
import { Input } from "@/components/ui/input";

export function RecordCardDebitDialog({
  open,
  onOpenChange,
  payingAgencyId,
  agencyName,
  debitTypes,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payingAgencyId: string;
  agencyName: string;
  debitTypes: GaindeCardDebitTypeRow[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debitTypeId, setDebitTypeId] = useState(debitTypes[0]?.id ?? "");
  const today = agencyCalendarDate();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!debitTypeId) {
      setError("Choisissez un type de débit.");
      return;
    }

    setPending(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const result = await recordCardDebitAction({
      payingAgencyId,
      debitTypeId,
      amount: String(form.get("amount") ?? ""),
      effectiveDate: String(form.get("effectiveDate") ?? today),
      label: String(form.get("label") ?? "") || undefined,
      notes: String(form.get("notes") ?? "") || undefined,
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
          <DialogTitle>Débit carte</DialogTitle>
          <DialogDescription>
            Débit sur la carte GAINDE — {agencyName}.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="debit-type" className="text-sm font-medium">
                Type de débit <span className="text-destructive">*</span>
              </label>
              <FormSelect
                id="debit-type"
                value={debitTypeId}
                onValueChange={setDebitTypeId}
                options={debitTypes.map((t) => ({
                  value: t.id,
                  label: t.name,
                }))}
                emptyOption="—"
                triggerClassName="w-full"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="debit-amount" className="text-sm font-medium">
                Montant (XOF) <span className="text-destructive">*</span>
              </label>
              <Input
                id="debit-amount"
                name="amount"
                inputMode="numeric"
                required
                placeholder="250000"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="debit-date" className="text-sm font-medium">
                Date
              </label>
              <Input
                id="debit-date"
                name="effectiveDate"
                type="date"
                defaultValue={today}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="debit-label" className="text-sm font-medium">
                Libellé (optionnel)
              </label>
              <Input id="debit-label" name="label" placeholder="Référence" />
            </div>
            {error ? <FormAlert variant="error">{error}</FormAlert> : null}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={pending || !debitTypeId}>
                {pending ? "Enregistrement…" : "Enregistrer"}
              </Button>
            </div>
          </form>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
