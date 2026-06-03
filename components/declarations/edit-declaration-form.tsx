"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useOrgFormSuggestions } from "@/components/hooks/use-form-suggestions";
import {
  setBonADelivrerAction,
  updateDeclarationAction,
} from "@/lib/actions/declarations";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-feedback";
import { FormSelect } from "@/components/ui/form-select";
import { FormSuggestInput } from "@/components/ui/form-suggest-input";
import { Input } from "@/components/ui/input";
import { ContainerNumbersField } from "@/components/declarations/container-numbers-field";
import { DeclarationResteField } from "@/components/declarations/declaration-reste-field";
import { mergeZoneSuggestions } from "@/lib/domain/pilot-zones";
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
  const { suggestions } = useOrgFormSuggestions();
  const [blReference, setBlReference] = useState(initial.blReference);
  const [zoneOrTerminal, setZoneOrTerminal] = useState(initial.zoneOrTerminal);
  const [pending, setPending] = useState(false);
  const [badPending, setBadPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [bonADelivrer, setBonADelivrer] = useState(initial.bonADelivrer);
  const [containerPayload, setContainerPayload] = useState({
    containers: initial.containers,
    containerCount: initial.containerCount,
  });
  const [clientAmountPaid, setClientAmountPaid] = useState(
    initial.clientAmountPaid,
  );
  const [costPrice, setCostPrice] = useState(initial.costPrice);

  useEffect(() => {
    setBlReference(initial.blReference);
    setZoneOrTerminal(initial.zoneOrTerminal);
    setBonADelivrer(initial.bonADelivrer);
    setContainerPayload({
      containers: initial.containers,
      containerCount: initial.containerCount,
    });
    setClientAmountPaid(initial.clientAmountPaid);
    setCostPrice(initial.costPrice);
  }, [
    formKey,
    initial.blReference,
    initial.zoneOrTerminal,
    initial.bonADelivrer,
    initial.containers,
    initial.containerCount,
    initial.clientAmountPaid,
    initial.costPrice,
  ]);

  const zoneSuggestions = useMemo(
    () => mergeZoneSuggestions(suggestions?.zoneOrTerminals ?? []),
    [suggestions?.zoneOrTerminals],
  );

  const containerCountShortfall =
    containerPayload.containerCount > 0 &&
    containerPayload.containers.length < containerPayload.containerCount;

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
              value={blReference}
              onChange={(e) => setBlReference(e.target.value)}
              className="font-mono"
              required
              autoComplete="off"
              spellCheck={false}
            />
            <p className="text-xs text-muted-foreground">
              Saisie manuelle uniquement.
            </p>
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
          <div className="flex flex-col gap-2 sm:col-span-2">
            <label htmlFor="zoneOrTerminal" className="text-sm font-medium">
              Zone / terminal
            </label>
            <FormSuggestInput
              key={`${formKey}-zone`}
              id="zoneOrTerminal"
              name="zoneOrTerminal"
              value={zoneOrTerminal}
              onValueChange={(v) => setZoneOrTerminal(v.toUpperCase())}
              className="font-mono uppercase"
              suggestions={zoneSuggestions}
              helperText="Saisie libre ou choix parmi les zones connues."
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold">Conteneurs</h2>
        {containerCountShortfall ? (
          <FormAlert
            variant="info"
            className="border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200"
          >
            {containerPayload.containers.length} numéro(s) renseigné(s) pour{" "}
            {containerPayload.containerCount} conteneur
            {containerPayload.containerCount > 1 ? "s" : ""} déclaré
            {containerPayload.containerCount > 1 ? "s" : ""}. Vous pouvez enregistrer
            ; le bon à délivrer exigera tous les numéros.
          </FormAlert>
        ) : null}
        <ContainerNumbersField
          formKey={formKey}
          initialContainers={initial.containers}
          initialCount={initial.containerCount}
          disabled={!canEdit}
          knownContainers={suggestions?.containerNumbers}
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
              value={clientAmountPaid}
              onChange={(e) => setClientAmountPaid(e.target.value)}
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
              value={costPrice}
              onChange={(e) => setCostPrice(e.target.value)}
            />
          </div>
          <DeclarationResteField
            clientAmountPaid={clientAmountPaid}
            costPrice={costPrice}
          />
          <div className="flex flex-col gap-2">
            <label htmlFor="payingAgencyId" className="text-sm font-medium">
              Maison-mère
            </label>
            <FormSelect
              key={`${formKey}-payingAgency`}
              id="payingAgencyId"
              name="payingAgencyId"
              emptyOption="—"
              defaultValue={initial.payingAgencyId}
              options={agencies.map((a) => ({ value: a.id, label: a.name }))}
            />
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
