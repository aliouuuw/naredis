"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { recordTransactionAction } from "@/lib/actions/ledger";
import { createTransactionTypeAction } from "@/lib/actions/transaction-types";
import { formatXof } from "@/lib/domain/balance";
import { agencyCalendarDate } from "@/lib/domain/timezone";
import type { DossierAllocationOption } from "@/lib/modules/ledger/service";
import type { TransactionTypeSerialized } from "@/lib/modules/ledger/serialize";
import { sumAllocations } from "@/lib/modules/ledger/allocations";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-feedback";
import { Input } from "@/components/ui/input";

type AllocationRow = { dossierId: string; amount: string };

export function RecordTransactionForm({
  customerId,
  customerName,
  dossiers,
  transactionTypes: initialTypes,
}: {
  customerId: string;
  customerName: string;
  dossiers: DossierAllocationOption[];
  transactionTypes: TransactionTypeSerialized[];
}) {
  const router = useRouter();
  const submitLock = useRef(false);
  const [types, setTypes] = useState(initialTypes);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [transactionTypeId, setTransactionTypeId] = useState(
    () => initialTypes.find((t) => t.code === "versement")?.id ?? initialTypes[0]?.id ?? "",
  );
  const [allocations, setAllocations] = useState<AllocationRow[]>([]);
  const [showNewType, setShowNewType] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeSide, setNewTypeSide] = useState<"credit" | "debit">("credit");
  const [typePending, setTypePending] = useState(false);

  const selectedType = types.find((t) => t.id === transactionTypeId);
  const isCredit = selectedType?.balanceSide === "credit";

  const creditTypes = types.filter((t) => t.balanceSide === "credit");
  const debitTypes = types.filter((t) => t.balanceSide === "debit");

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
    isCredit && entryAmount > BigInt(0) && allocationTotal > entryAmount;

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

  async function handleCreateType() {
    if (!newTypeName.trim()) return;
    setTypePending(true);
    setError(null);

    const result = await createTransactionTypeAction({
      name: newTypeName.trim(),
      balanceSide: newTypeSide,
    });

    setTypePending(false);

    if (!result.ok || !result.data) {
      setError(result.ok ? "Réponse invalide." : result.error);
      return;
    }

    const created = result.data;
    setTypes((prev) =>
      [...prev, created].sort((a, b) => a.sortOrder - b.sortOrder),
    );
    setTransactionTypeId(result.data.id);
    setNewTypeName("");
    setShowNewType(false);
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitLock.current || !transactionTypeId) return;

    submitLock.current = true;
    setPending(true);
    setError(null);
    setSuccess(null);

    const form = new FormData(event.currentTarget);
    const lines = isCredit
      ? allocations
          .filter((a) => a.dossierId && a.amount.trim())
          .map((a) => ({
            dossierId: a.dossierId,
            amount: a.amount.replace(/\s/g, ""),
          }))
      : [];

    try {
      const result = await recordTransactionAction(customerId, {
        transactionTypeId,
        label: String(form.get("label") ?? ""),
        amount: amount.replace(/\s/g, ""),
        effectiveDate: String(form.get("effectiveDate") ?? ""),
        notes: String(form.get("notes") ?? "") || undefined,
        allocations: lines,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setSuccess("Transaction enregistrée.");
      setAmount("");
      setAllocations([]);
      (event.target as HTMLFormElement).reset();
      router.refresh();
    } finally {
      submitLock.current = false;
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-lg border bg-card p-4">
      <div>
        <h3 className="text-sm font-semibold">Nouvelle transaction</h3>
        <p className="text-xs text-muted-foreground">
          Client : {customerName} — crédit ou débit selon le type choisi.
        </p>
      </div>

      {error ? <FormAlert variant="error">{error}</FormAlert> : null}
      {success ? <FormAlert variant="success">{success}</FormAlert> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2 sm:col-span-2">
          <label htmlFor="transaction-type" className="text-sm font-medium">
            Type <span className="text-destructive">*</span>
          </label>
          <div className="flex flex-wrap gap-2">
            <select
              id="transaction-type"
              value={transactionTypeId}
              onChange={(e) => {
                setTransactionTypeId(e.target.value);
                if (!types.find((t) => t.id === e.target.value)?.balanceSide) {
                  return;
                }
                const t = types.find((x) => x.id === e.target.value);
                if (t?.balanceSide !== "credit") {
                  setAllocations([]);
                }
              }}
              required
              className="h-8 min-w-0 flex-1 rounded-lg border border-input bg-background px-2.5 text-sm"
            >
              <optgroup label="Crédit (encaissements)">
                {creditTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Débit (charges)">
                {debitTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </optgroup>
            </select>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowNewType((v) => !v)}
            >
              <Plus className="size-3.5" aria-hidden />
              Nouveau type
            </Button>
          </div>
        </div>

        {showNewType ? (
          <div className="sm:col-span-2 rounded-lg border border-dashed bg-muted/30 p-3 space-y-3">
            <p className="text-xs font-medium">Ajouter un type</p>
            <div className="flex flex-wrap gap-2">
              <Input
                placeholder="Ex. Virement banque"
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                className="min-w-[12rem] flex-1"
              />
              <select
                value={newTypeSide}
                onChange={(e) =>
                  setNewTypeSide(e.target.value as "credit" | "debit")
                }
                className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm"
              >
                <option value="credit">Crédit</option>
                <option value="debit">Débit</option>
              </select>
              <Button
                type="button"
                size="sm"
                disabled={typePending || !newTypeName.trim()}
                onClick={() => void handleCreateType()}
              >
                {typePending ? "…" : "Ajouter"}
              </Button>
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-2 sm:col-span-2">
          <label htmlFor="tx-label" className="text-sm font-medium">
            Libellé <span className="text-destructive">*</span>
          </label>
          <Input id="tx-label" name="label" required placeholder="Libellé" />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="tx-amount" className="text-sm font-medium">
            Montant (XOF) <span className="text-destructive">*</span>
          </label>
          <Input
            id="tx-amount"
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
          <label htmlFor="tx-date" className="text-sm font-medium">
            Date <span className="text-destructive">*</span>
          </label>
          <Input
            id="tx-date"
            name="effectiveDate"
            type="date"
            required
            defaultValue={agencyCalendarDate()}
          />
        </div>
        <div className="flex flex-col gap-2 sm:col-span-2">
          <label htmlFor="tx-notes" className="text-sm font-medium">
            Notes
          </label>
          <Input id="tx-notes" name="notes" />
        </div>
      </div>

      {isCredit ? (
        <div className="space-y-3 border-t pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium">Affectation aux dossiers (optionnel)</p>
            {dossiers.length > 0 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addAllocationRow}
              >
                <Plus className="size-3.5" aria-hidden />
                Ligne
              </Button>
            ) : null}
          </div>
          {allocations.length > 0 ? (
            <ul className="space-y-2">
              {allocations.map((row, index) => (
                <li key={index} className="flex flex-wrap items-end gap-2">
                  <select
                    value={row.dossierId}
                    onChange={(e) =>
                      updateAllocation(index, "dossierId", e.target.value)
                    }
                    className="h-8 min-w-0 flex-1 rounded-lg border border-input bg-background px-2.5 text-sm"
                    required
                  >
                    <option value="" disabled>
                      Dossier
                    </option>
                    {dossiers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.dossierNumber}
                        {d.blReference ? ` · BL ${d.blReference}` : ""}
                      </option>
                    ))}
                  </select>
                  <Input
                    type="number"
                    min={1}
                    className="w-36 tabular-nums"
                    value={row.amount}
                    onChange={(e) =>
                      updateAllocation(index, "amount", e.target.value)
                    }
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeAllocationRow(index)}
                    aria-label="Retirer"
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
              Affecté : {formatXof(allocationTotal)} / {formatXof(entryAmount)} XOF
            </p>
          ) : null}
        </div>
      ) : null}

      <Button
        type="submit"
        disabled={pending || allocationMismatch || !transactionTypeId}
      >
        {pending ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </form>
  );
}
