"use client";

import { useMemo, useRef, useState } from "react";
import {
  useCustomerFormSuggestions,
  useOrgFormSuggestions,
} from "@/components/hooks/use-form-suggestions";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { recordTransactionAction } from "@/lib/actions/ledger";
import {
  createTransactionTypeAction,
  updateTransactionTypeAction,
} from "@/lib/actions/transaction-types";
import { formatXof } from "@/lib/domain/balance";
import { agencyCalendarDate } from "@/lib/domain/timezone";
import type { DossierAllocationOption } from "@/lib/modules/ledger/service";
import type { TransactionTypeSerialized } from "@/lib/modules/ledger/serialize";
import { sumAllocations } from "@/lib/modules/ledger/allocations";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-feedback";
import { FormSelect } from "@/components/ui/form-select";
import { FormSuggestInput } from "@/components/ui/form-suggest-input";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type AllocationRow = { dossierId: string; amount: string };

export function RecordTransactionForm({
  customerId,
  customerName,
  dossiers,
  dossiersLoading = false,
  transactionTypes: initialTypes,
  embedded = false,
  onSuccess,
  customerLedgerLabels,
}: {
  customerId: string;
  customerName: string;
  dossiers: DossierAllocationOption[];
  dossiersLoading?: boolean;
  transactionTypes: TransactionTypeSerialized[];
  /** Render inside a dialog (no card chrome or duplicate title). */
  embedded?: boolean;
  onSuccess?: () => void;
  customerLedgerLabels?: string[];
}) {
  const router = useRouter();
  const submitLock = useRef(false);
  const { suggestions: orgSuggestions } = useOrgFormSuggestions();
  const customerSuggestions = useCustomerFormSuggestions(
    customerId,
    true,
    customerLedgerLabels,
  );
  const [label, setLabel] = useState("");
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
  const [showManageTypes, setShowManageTypes] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeSide, setNewTypeSide] = useState<"credit" | "debit">("credit");
  const [typePending, setTypePending] = useState(false);
  const [editingTypeId, setEditingTypeId] = useState<string | null>(null);
  const [editingTypeName, setEditingTypeName] = useState("");

  const selectedType = types.find((t) => t.id === transactionTypeId);
  const isCredit = selectedType?.balanceSide === "credit";

  const operableTypes = types.filter(
    (t) => t.systemKey !== "opening_balance" && t.systemKey !== "reversal",
  );

  const creditTypes = operableTypes.filter((t) => t.balanceSide === "credit");
  const debitTypes = operableTypes.filter((t) => t.balanceSide === "debit");

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

  async function handleRenameType(typeId: string) {
    const name = editingTypeName.trim();
    if (!name) return;
    setTypePending(true);
    setError(null);
    const result = await updateTransactionTypeAction({
      transactionTypeId: typeId,
      name,
    });
    setTypePending(false);
    if (!result.ok || !result.data) {
      setError(result.ok ? "Réponse invalide." : result.error);
      return;
    }
    setTypes((prev) =>
      prev
        .map((t) => (t.id === typeId ? result.data! : t))
        .sort((a, b) => a.sortOrder - b.sortOrder),
    );
    setEditingTypeId(null);
    setEditingTypeName("");
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
      if (onSuccess) {
        window.setTimeout(onSuccess, 600);
      }
    } finally {
      submitLock.current = false;
      setPending(false);
    }
  }

  return (
    <form
      id="record-transaction"
      onSubmit={onSubmit}
      className={cn(
        "space-y-4",
        !embedded &&
          "scroll-mt-24 rounded-lg border bg-card p-4 transition-shadow",
      )}
    >
      {!embedded ? (
        <div>
          <h3 className="text-sm font-semibold">Nouvelle transaction</h3>
          <p className="text-xs text-muted-foreground">
            Client : {customerName} — crédit ou débit selon le type choisi.
          </p>
        </div>
      ) : null}

      {error ? <FormAlert variant="error">{error}</FormAlert> : null}
      {success ? <FormAlert variant="success">{success}</FormAlert> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2 sm:col-span-2">
          <label htmlFor="transaction-type" className="text-sm font-medium">
            Type <span className="text-destructive">*</span>
          </label>
          <div className="flex flex-wrap gap-2">
            <FormSelect
              id="transaction-type"
              value={transactionTypeId}
              required
              triggerClassName="min-w-0 flex-1"
              onValueChange={(id) => {
                setTransactionTypeId(id);
                const t = types.find((x) => x.id === id);
                if (t?.balanceSide !== "credit") {
                  setAllocations([]);
                }
              }}
              groups={[
                {
                  label: "Crédit (encaissements)",
                  options: creditTypes.map((t) => ({
                    value: t.id,
                    label: t.name,
                  })),
                },
                {
                  label: "Débit (charges)",
                  options: debitTypes.map((t) => ({
                    value: t.id,
                    label: t.name,
                  })),
                },
              ]}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowNewType((v) => !v)}
            >
              <Plus className="size-3.5" aria-hidden />
              Nouveau type
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowManageTypes((v) => !v)}
            >
              Modifier les types
            </Button>
          </div>
        </div>

        {showManageTypes ? (
          <div className="sm:col-span-2 space-y-2 rounded-lg border bg-muted/20 p-3">
            <p className="text-xs font-medium">Renommer un type</p>
            <ul className="space-y-2">
              {types.map((t) => (
                <li
                  key={t.id}
                  className="flex flex-wrap items-center gap-2 text-sm"
                >
                  {editingTypeId === t.id ? (
                    <>
                      <Input
                        value={editingTypeName}
                        onChange={(e) => setEditingTypeName(e.target.value)}
                        className="min-w-[10rem] flex-1"
                      />
                      <Button
                        type="button"
                        size="sm"
                        disabled={typePending || !editingTypeName.trim()}
                        onClick={() => void handleRenameType(t.id)}
                      >
                        Enregistrer
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingTypeId(null);
                          setEditingTypeName("");
                        }}
                      >
                        Annuler
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="min-w-0 flex-1">{t.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {t.balanceSide === "credit" ? "Crédit" : "Débit"}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingTypeId(t.id);
                          setEditingTypeName(t.name);
                        }}
                      >
                        Renommer
                      </Button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

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
              <FormSelect
                value={newTypeSide}
                onValueChange={(v) =>
                  setNewTypeSide(v as "credit" | "debit")
                }
                triggerClassName="w-[7rem]"
                options={[
                  { value: "credit", label: "Crédit" },
                  { value: "debit", label: "Débit" },
                ]}
              />
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
          <FormSuggestInput
            id="tx-label"
            name="label"
            required
            placeholder="Libellé"
            value={label}
            onValueChange={setLabel}
            suggestions={[
              ...(customerSuggestions?.ledgerLabels.map((l) => ({
                value: l,
                group: "Ce client",
              })) ?? []),
              ...(orgSuggestions?.ledgerLabels
                .filter((l) => !customerSuggestions?.ledgerLabels.includes(l))
                .map((l) => ({ value: l, group: "Cabinet" })) ?? []),
            ]}
          />
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
                  <FormSelect
                    value={row.dossierId}
                    onValueChange={(v) =>
                      updateAllocation(index, "dossierId", v)
                    }
                    required
                    placeholder="Dossier"
                    triggerClassName="min-w-0 flex-1"
                    options={dossiers.map((d) => ({
                      value: d.id,
                      label: `${d.dossierNumber}${
                        d.blReference ? ` · BL ${d.blReference}` : ""
                      }`,
                    }))}
                  />
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
        disabled={
          pending ||
          allocationMismatch ||
          !transactionTypeId ||
          dossiersLoading
        }
      >
        {pending ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </form>
  );
}
