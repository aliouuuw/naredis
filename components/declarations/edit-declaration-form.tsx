"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  setBonADelivrerAction,
  updateDeclarationAction,
} from "@/lib/actions/declarations";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-feedback";
import { Input } from "@/components/ui/input";
import { ContainerNumbersField } from "@/components/declarations/container-numbers-field";
import type { AgencyOption } from "./new-declaration-form";

export type EditDeclarationInitial = {
  declarationId: string;
  blReference: string;
  zoneOrTerminal: string;
  declarationDate: string;
  containerCount: number;
  containers: string[];
  clientAmountPaid: string;
  gaindeDutyAmount: string;
  costPrice: string;
  payingAgencyId: string;
  customsReference: string;
  bureau: string;
  bonADelivrer: boolean;
};

function parseMoney(value: string): string | null | undefined {
  const trimmed = value.replace(/\s/g, "");
  if (!trimmed) return null;
  return trimmed;
}

export function EditDeclarationForm({
  formKey,
  initial,
  agencies,
  canEdit,
  onSaved,
  compactFooter = false,
}: {
  /** Bumps after server refresh so defaultValues stay in sync. */
  formKey: string;
  initial: EditDeclarationInitial;
  agencies: AgencyOption[];
  canEdit: boolean;
  onSaved?: () => void;
  /** Sheet layout: simpler footer without full-width sticky bar. */
  compactFooter?: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [badPending, setBadPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [bonADelivrer, setBonADelivrer] = useState(initial.bonADelivrer);
  const [containerPayload, setContainerPayload] = useState({
    containers: initial.containers,
    containerCount: initial.containerCount,
  });

  useEffect(() => {
    setBonADelivrer(initial.bonADelivrer);
    setContainerPayload({
      containers: initial.containers,
      containerCount: initial.containerCount,
    });
  }, [formKey, initial.bonADelivrer, initial.containers, initial.containerCount]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canEdit) return;

    setPending(true);
    setError(null);
    setSuccess(null);

    const form = new FormData(event.currentTarget);

    const result = await updateDeclarationAction({
      declarationId: initial.declarationId,
      blReference: String(form.get("blReference") ?? ""),
      zoneOrTerminal: String(form.get("zoneOrTerminal") ?? "") || null,
      declarationDate: String(form.get("declarationDate") ?? "") || null,
      containerCount: containerPayload.containerCount,
      containers: containerPayload.containers,
      clientAmountPaid: parseMoney(String(form.get("clientAmountPaid") ?? "")),
      gaindeDutyAmount: parseMoney(String(form.get("gaindeDutyAmount") ?? "")),
      costPrice: parseMoney(String(form.get("costPrice") ?? "")),
      payingAgencyId: String(form.get("payingAgencyId") ?? ""),
      customsReference: String(form.get("customsReference") ?? "") || null,
      bureau: String(form.get("bureau") ?? "") || null,
      bonADelivrer,
    });

    setPending(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setSuccess("Modifications enregistrées.");
    if (onSaved) {
      onSaved();
    } else {
      router.refresh();
    }
  }

  async function onBonADelivrerChange(checked: boolean) {
    if (!canEdit) return;

    setBadPending(true);
    setError(null);
    setSuccess(null);

    const result = await setBonADelivrerAction(initial.declarationId, checked);
    setBadPending(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setBonADelivrer(checked);
    setSuccess(
      checked ? "Bon à délivrer certifié." : "Bon à délivrer retiré.",
    );
    if (onSaved) {
      onSaved();
    } else {
      router.refresh();
    }
  }

  if (!canEdit) {
    return null;
  }

  return (
    <form key={formKey} onSubmit={onSubmit} className="flex flex-col gap-6">
      {error ? <FormAlert variant="error">{error}</FormAlert> : null}
      {success ? <FormAlert variant="success">{success}</FormAlert> : null}

      <section className="rounded-lg border bg-card p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-sm font-semibold">Bon à délivrer</h2>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={bonADelivrer}
              disabled={badPending || pending}
              onChange={(e) => void onBonADelivrerChange(e.target.checked)}
              className="size-4 shrink-0 cursor-pointer rounded border border-input accent-primary"
            />
            {badPending ? "Vérification…" : bonADelivrer ? "Certifié" : "Non certifié"}
          </label>
        </div>
        <p className="text-xs text-muted-foreground">
          Enregistrez d&apos;abord la fiche, puis cochez quand tous les champs sont
          remplis.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold">Logistique</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2 sm:col-span-2">
            <label htmlFor="blReference" className="text-sm font-medium">
              Numéro BL
            </label>
            <Input
              id="blReference"
              name="blReference"
              defaultValue={initial.blReference}
              className="font-mono"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="declarationDate" className="text-sm font-medium">
              Date de déclaration
            </label>
            <Input
              id="declarationDate"
              name="declarationDate"
              type="date"
              defaultValue={initial.declarationDate}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="zoneOrTerminal" className="text-sm font-medium">
              Zone / terminal
            </label>
            <Input
              id="zoneOrTerminal"
              name="zoneOrTerminal"
              defaultValue={initial.zoneOrTerminal}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="customsReference" className="text-sm font-medium">
              N° douane
            </label>
            <Input
              id="customsReference"
              name="customsReference"
              defaultValue={initial.customsReference}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="bureau" className="text-sm font-medium">
              Bureau
            </label>
            <Input id="bureau" name="bureau" defaultValue={initial.bureau} />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold">Conteneurs</h2>
        <ContainerNumbersField
          formKey={formKey}
          initialContainers={initial.containers}
          initialCount={initial.containerCount}
          disabled={!canEdit}
          onChange={setContainerPayload}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold">Montants (fiche)</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="clientAmountPaid" className="text-sm font-medium">
              Montant client (XOF)
            </label>
            <Input
              id="clientAmountPaid"
              name="clientAmountPaid"
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              defaultValue={initial.clientAmountPaid}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="gaindeDutyAmount" className="text-sm font-medium">
              GAINDE (XOF)
            </label>
            <Input
              id="gaindeDutyAmount"
              name="gaindeDutyAmount"
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              defaultValue={initial.gaindeDutyAmount}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="costPrice" className="text-sm font-medium">
              Prix de revient (XOF)
            </label>
            <Input
              id="costPrice"
              name="costPrice"
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              defaultValue={initial.costPrice}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="payingAgencyId" className="text-sm font-medium">
              Maison-mère
            </label>
            <select
              id="payingAgencyId"
              name="payingAgencyId"
              className="h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              defaultValue={initial.payingAgencyId}
            >
              <option value="">—</option>
              {agencies.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <div
        className={
          compactFooter
            ? "border-t border-border pt-4"
            : "sticky bottom-0 z-10 -mx-4 border-t border-border bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:-mx-0 md:rounded-lg md:border md:px-4"
        }
      >
        <Button
          type="submit"
          disabled={pending || badPending}
          className={compactFooter ? "w-full" : "w-full sm:w-auto"}
        >
          {pending ? "Enregistrement…" : "Enregistrer les modifications"}
        </Button>
      </div>
    </form>
  );
}
