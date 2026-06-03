"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { closeDossierCaseAction } from "@/lib/actions/dossiers";
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

export function DossierCloseDialog({
  open,
  onOpenChange,
  dossierId,
  dossierNumber,
  warnings,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dossierId: string;
  dossierNumber: string;
  warnings: string[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onConfirm() {
    setPending(true);
    setError(null);

    const result = await closeDossierCaseAction(dossierId);

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
          <DialogTitle>Clôturer le dossier</DialogTitle>
          <DialogDescription>
            Le dossier « {dossierNumber} » passera au statut clôturé. Cette
            action reste réversible en pilot (réouverture manuelle ultérieure).
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-4">
          {warnings.length > 0 ? (
            <div
              className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100"
              role="alert"
            >
              <p className="font-medium">Points d&apos;attention</p>
              <ul className="mt-1.5 list-disc space-y-1 pl-4">
                {warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
          ) : null}
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
            <Button type="button" onClick={onConfirm} disabled={pending}>
              {pending ? "Clôture…" : "Clôturer"}
            </Button>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
