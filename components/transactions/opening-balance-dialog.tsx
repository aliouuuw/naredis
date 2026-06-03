"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { recordOpeningBalanceAction } from "@/lib/actions/ledger";
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
import { FormSelect } from "@/components/ui/form-select";
import { Input } from "@/components/ui/input";

export function OpeningBalanceDialog({
  open,
  onOpenChange,
  customerId,
  customerName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  customerName: string;
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
    const result = await recordOpeningBalanceAction(customerId, {
      amount: String(form.get("amount") ?? ""),
      balanceSide: String(form.get("balanceSide") ?? "") as "debit" | "credit",
      effectiveDate: String(form.get("effectiveDate") ?? today),
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
          <DialogTitle>Solde d&apos;ouverture</DialogTitle>
          <DialogDescription>
            Point de départ du compte pour {customerName}. Une seule écriture
            d&apos;ouverture par client.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="ob-amount" className="text-sm font-medium">
                Montant (XOF) <span className="text-destructive">*</span>
              </label>
              <Input
                id="ob-amount"
                name="amount"
                inputMode="numeric"
                required
                placeholder="150000"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="ob-side" className="text-sm font-medium">
                Sens du solde <span className="text-destructive">*</span>
              </label>
              <FormSelect
                id="ob-side"
                name="balanceSide"
                required
                defaultValue="debit"
                options={[
                  {
                    value: "debit",
                    label: "Débit — le client doit à l'agence",
                  },
                  {
                    value: "credit",
                    label: "Crédit — l'agence doit au client",
                  },
                ]}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="ob-date" className="text-sm font-medium">
                Date d&apos;effet
              </label>
              <Input
                id="ob-date"
                name="effectiveDate"
                type="date"
                defaultValue={today}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="ob-notes" className="text-sm font-medium">
                Notes
              </label>
              <Input id="ob-notes" name="notes" placeholder="Optionnel" />
            </div>
            {error ? <FormAlert variant="error">{error}</FormAlert> : null}
            <div className="flex justify-end gap-2 pt-1">
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
