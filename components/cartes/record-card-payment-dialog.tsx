"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { recordCardPaymentAction } from "@/lib/actions/gainde-cards";
import { agencyCalendarDate } from "@/lib/domain/timezone";
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
import { Input } from "@/components/ui/input";

export function RecordCardPaymentDialog({
  open,
  onOpenChange,
  payingAgencyId,
  agencyName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payingAgencyId: string;
  agencyName: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const today = agencyCalendarDate();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const result = await recordCardPaymentAction({
      payingAgencyId,
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
          <DialogTitle>Règlement de carte</DialogTitle>
          <DialogDescription>
            Crédit sur la carte GAINDE — {agencyName}.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="payment-amount" className="text-sm font-medium">
                Montant (XOF) <span className="text-destructive">*</span>
              </label>
              <Input
                id="payment-amount"
                name="amount"
                inputMode="numeric"
                required
                placeholder="5000000"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="payment-date" className="text-sm font-medium">
                Date
              </label>
              <Input
                id="payment-date"
                name="effectiveDate"
                type="date"
                defaultValue={today}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="payment-label" className="text-sm font-medium">
                Libellé (optionnel)
              </label>
              <Input
                id="payment-label"
                name="label"
                placeholder="Règlement mensuel"
              />
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
              <Button type="submit" disabled={pending}>
                {pending ? "Enregistrement…" : "Enregistrer"}
              </Button>
            </div>
          </form>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
