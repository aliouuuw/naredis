"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { recordVersementAction } from "@/lib/actions/ledger";
import { formatXof } from "@/lib/domain/balance";
import { agencyCalendarDate } from "@/lib/domain/timezone";
import type { DossierAllocationOption } from "@/lib/modules/ledger/service";
import { sumAllocations } from "@/lib/modules/ledger/allocations";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-feedback";
import { Input } from "@/components/ui/input";

type AllocationRow = { dossierId: string; amount: string };

export function RecordVersementForm({
  customerId,
  dossiers,
}: {
  customerId: string;
  dossiers: DossierAllocationOption[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [allocations, setAllocations] = useState<AllocationRow[]>([]);

  const allocationTotal = useMemo(() => {
    try {
      return sumAllocations(
        allocations
          .filter((a) => a.dossierId && a.amount.trim())
          .map((a) => ({
            dossierId: a.dossierId,
            amount: BigInt(a.amount.replace(/\s/g, "") || "0"),
          })),
      );
    } catch {
      return BigInt(0);
    }
  }, [allocations]);

  const entryAmount = useMemo(() => {
    const trimmed = amount.replace(/\s/g, "");
    if (!trimmed) return BigInt(0);
    try {
      return BigInt(trimmed);
    } catch {
      return BigInt(0);
    }
  }, [amount]);

  const allocationMismatch =
    entryAmount > BigInt(0) && allocationTotal > entryAmount;

  function addAllocationRow() {
    setAllocations((prev) => [...prev, { dossierId: "", amount: "" }]);
  }

  function removeAllocationRow(index: number) {
    setAllocations((prev) => prev.filter((_, i) => i !== index));
  }

  function updateAllocation(
    index: number,
    field: keyof AllocationRow,
    value: string,
  ) {
    setAllocations((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setSuccess(null);

    const form = new FormData(event.currentTarget);
    const lines = allocations
      .filter((a) => a.dossierId && a.amount.trim())
      .map((a) => ({
        dossierId: a.dossierId,
        amount: a.amount.replace(/\s/g, ""),
      }));

    const result = await recordVersementAction({
      customerId,
      label: String(form.get("label") ?? ""),
      amount: amount.replace(/\s/g, ""),
      effectiveDate: String(form.get("effectiveDate") ?? ""),
      notes: String(form.get("notes") ?? "") || undefined,
      allocations: lines,
    });

    setPending(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setSuccess("Versement enregistré.");
    setAmount("");
    setAllocations([]);
    (event.target as HTMLFormElement).reset();
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-lg border bg-card p-4">
      <div>
        <h3 className="text-sm font-semibold">Enregistrer un versement</h3>
        <p className="text-xs text-muted-foreground">
          Crédit client — affectation optionnelle à un ou plusieurs dossiers.
        </p>
      </div>

      {error ? <FormAlert variant="error">{error}</FormAlert> : null}
      {success ? <FormAlert variant="success">{success}</FormAlert> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2 sm:col-span-2">
          <label htmlFor="versement-label" className="text-sm font-medium">
            Libellé <span className="text-destructive">*</span>
          </label>
          <Input
            id="versement-label"
            name="label"
            required
            placeholder="Virement client"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="versement-amount" className="text-sm font-medium">
            Montant (XOF) <span className="text-destructive">*</span>
          </label>
          <Input
            id="versement-amount"
            name="amount"
            type="number"
            min={1}
            step={1}
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="tabular-nums"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="versement-date" className="text-sm font-medium">
            Date <span className="text-destructive">*</span>
          </label>
          <Input
            id="versement-date"
            name="effectiveDate"
            type="date"
            required
            defaultValue={agencyCalendarDate()}
          />
        </div>
        <div className="flex flex-col gap-2 sm:col-span-2">
          <label htmlFor="versement-notes" className="text-sm font-medium">
            Notes
          </label>
          <Input id="versement-notes" name="notes" />
        </div>
      </div>

      <div className="space-y-3 border-t pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium">Affectation aux dossiers</p>
          {dossiers.length > 0 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={addAllocationRow}
            >
              <Plus className="size-3.5" aria-hidden />
              Ligne d&apos;affectation
            </Button>
          ) : null}
        </div>

        {dossiers.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Aucun dossier pour ce client — le versement restera sur le compte
            client uniquement.
          </p>
        ) : null}

        {allocations.length > 0 ? (
          <ul className="space-y-2">
            {allocations.map((row, index) => (
              <li
                key={index}
                className="flex flex-wrap items-end gap-2 sm:flex-nowrap"
              >
                <div className="min-w-0 flex-1">
                  <label className="sr-only">Dossier</label>
                  <select
                    value={row.dossierId}
                    onChange={(e) =>
                      updateAllocation(index, "dossierId", e.target.value)
                    }
                    className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                    required
                  >
                    <option value="" disabled>
                      Choisir un dossier
                    </option>
                    {dossiers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.dossierNumber}
                        {d.blReference ? ` · BL ${d.blReference}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-36 shrink-0">
                  <label className="sr-only">Montant affecté</label>
                  <Input
                    type="number"
                    min={1}
                    step={1}
                    placeholder="XOF"
                    value={row.amount}
                    onChange={(e) =>
                      updateAllocation(index, "amount", e.target.value)
                    }
                    className="tabular-nums"
                    required
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  aria-label="Retirer l'affectation"
                  onClick={() => removeAllocationRow(index)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        ) : null}

        {entryAmount > BigInt(0) && allocations.length > 0 ? (
          <p
            className={
              allocationMismatch
                ? "text-xs text-destructive"
                : "text-xs text-muted-foreground"
            }
          >
            Affecté : {formatXof(allocationTotal)} / {formatXof(entryAmount)}{" "}
            XOF
            {allocationMismatch
              ? " — la somme ne peut pas dépasser le versement."
              : null}
          </p>
        ) : null}
      </div>

      <Button type="submit" disabled={pending || allocationMismatch}>
        {pending ? "Enregistrement…" : "Enregistrer le versement"}
      </Button>
    </form>
  );
}
