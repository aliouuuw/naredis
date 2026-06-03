"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { reverseLedgerEntryAction } from "@/lib/actions/ledger";
import { formatXof } from "@/lib/domain/balance";
import { agencyCalendarDate } from "@/lib/domain/timezone";
import type { LedgerEntrySerialized } from "@/lib/modules/ledger/serialize";
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

export function ReverseEntryDialog({
  open,
  onOpenChange,
  entry,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: LedgerEntrySerialized | null;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const today = agencyCalendarDate();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!entry) return;

    setPending(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const result = await reverseLedgerEntryAction(entry.id, {
      reason: String(form.get("reason") ?? ""),
      effectiveDate: String(form.get("effectiveDate") ?? today),
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
          <DialogTitle>Contre-passation</DialogTitle>
          <DialogDescription>
            {entry ? (
              <>
                Annule l&apos;écriture « {entry.label} » (
                {formatXof(BigInt(entry.amount))} XOF). Le motif est conservé
                dans les notes.
              </>
            ) : (
              "Sélectionnez une écriture à contre-passer."
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          {entry ? (
            <form onSubmit={onSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="rev-reason" className="text-sm font-medium">
                  Motif <span className="text-destructive">*</span>
                </label>
                <textarea
                  id="rev-reason"
                  name="reason"
                  required
                  rows={3}
                  placeholder="Ex. erreur de saisie, doublon…"
                  className="flex min-h-[80px] w-full rounded-lg border border-input bg-background px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="rev-date" className="text-sm font-medium">
                  Date d&apos;effet
                </label>
                <Input
                  id="rev-date"
                  name="effectiveDate"
                  type="date"
                  defaultValue={today}
                  required
                />
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
                <Button type="submit" variant="destructive" disabled={pending}>
                  {pending ? "Contre-passation…" : "Contre-passer"}
                </Button>
              </div>
            </form>
          ) : null}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
