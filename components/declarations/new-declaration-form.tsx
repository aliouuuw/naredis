"use client";

import { useMemo, useState } from "react";
import { createDeclarationAction } from "@/lib/actions/declarations";
import { buildDeclarationNumber } from "@/lib/domain/declaration-number";
import { pilotZoneOptions } from "@/lib/domain/pilot-zones";
import { ContainerNumbersField } from "@/components/declarations/container-numbers-field";
import { DeclarationResteField } from "@/components/declarations/declaration-reste-field";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-feedback";
import { FormSelect } from "@/components/ui/form-select";
import { Input } from "@/components/ui/input";

export type CustomerOption = { id: string; name: string; slug: string };
export type AgencyOption = { id: string; name: string };

function parseMoney(value: string): string | undefined {
  const trimmed = value.replace(/\s/g, "");
  if (!trimmed) return undefined;
  return trimmed;
}

export function NewDeclarationForm({
  customers,
  agencies,
  embedded = false,
  defaultCustomerId,
  onSuccess,
  onCancel,
  onRequestNewClient,
}: {
  customers: CustomerOption[];
  agencies: AgencyOption[];
  embedded?: boolean;
  defaultCustomerId?: string;
  onSuccess?: (declarationId: string) => void;
  onCancel?: () => void;
  onRequestNewClient?: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [containerPayload, setContainerPayload] = useState({
    containers: [] as string[],
    containerCount: 1,
  });
  const [numberPrefix, setNumberPrefix] = useState("1");
  const [numberZone, setNumberZone] = useState("18N");
  const [numberSuffix, setNumberSuffix] = useState("001");
  const [clientAmountPaid, setClientAmountPaid] = useState("");
  const [costPrice, setCostPrice] = useState("");

  const previewNumber = useMemo(() => {
    try {
      return buildDeclarationNumber(numberPrefix, numberZone, numberSuffix);
    } catch {
      return null;
    }
  }, [numberPrefix, numberZone, numberSuffix]);

  const hasCustomers = customers.length > 0;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setSuccess(null);

    const form = new FormData(event.currentTarget);

    const result = await createDeclarationAction({
      customerId: String(form.get("customerId") ?? ""),
      declarationNumberPrefix: String(form.get("declarationNumberPrefix") ?? ""),
      declarationZoneSlug: String(form.get("declarationZoneSlug") ?? ""),
      declarationNumberSuffix: String(form.get("declarationNumberSuffix") ?? ""),
      blReference: String(form.get("blReference") ?? ""),
      declarationDate: String(form.get("declarationDate") ?? "") || undefined,
      containerCount: containerPayload.containerCount,
      containers: containerPayload.containers,
      clientAmountPaid: parseMoney(String(form.get("clientAmountPaid") ?? "")),
      gaindeDutyAmount: parseMoney(String(form.get("gaindeDutyAmount") ?? "")),
      costPrice: parseMoney(String(form.get("costPrice") ?? "")),
      payingAgencyId: String(form.get("payingAgencyId") ?? ""),
      title: String(form.get("title") ?? "") || undefined,
    });

    setPending(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setSuccess("Déclaration créée.");
    onSuccess?.(result.data!.id);
  }

  if (!hasCustomers) {
    return (
      <div className="space-y-3 py-2 text-sm text-muted-foreground">
        <p>Créez d&apos;abord un client avant d&apos;ouvrir une déclaration.</p>
        {onRequestNewClient ? (
          <Button type="button" size="sm" onClick={onRequestNewClient}>
            Nouveau client
          </Button>
        ) : null}
        {onCancel ? (
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            Fermer
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className={embedded ? "flex flex-col gap-6" : "flex max-w-2xl flex-col gap-6"}
    >
      {error ? <FormAlert variant="error">{error}</FormAlert> : null}
      {success ? <FormAlert variant="success">{success}</FormAlert> : null}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold">Numéro de déclaration</h2>
        <p className="text-xs text-muted-foreground">
          Format : préfixe — zone — D suffixe (ex. 1-18N-D001).
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-2">
            <label htmlFor="declarationNumberPrefix" className="text-sm font-medium">
              Préfixe <span className="text-destructive">*</span>
            </label>
            <Input
              id="declarationNumberPrefix"
              name="declarationNumberPrefix"
              required
              className="font-mono"
              value={numberPrefix}
              onChange={(e) => setNumberPrefix(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="declarationZoneSlug" className="text-sm font-medium">
              Zone / terminal <span className="text-destructive">*</span>
            </label>
            <FormSelect
              id="declarationZoneSlug"
              name="declarationZoneSlug"
              required
              value={numberZone}
              onValueChange={setNumberZone}
              options={pilotZoneOptions()}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label
              htmlFor="declarationNumberSuffix"
              className="text-sm font-medium"
            >
              Suffixe <span className="text-destructive">*</span>
            </label>
            <Input
              id="declarationNumberSuffix"
              name="declarationNumberSuffix"
              required
              className="font-mono"
              placeholder="001"
              value={numberSuffix}
              onChange={(e) => setNumberSuffix(e.target.value)}
            />
          </div>
        </div>
        {previewNumber ? (
          <p className="text-sm">
            Aperçu :{" "}
            <span className="font-mono font-semibold">{previewNumber}</span>
          </p>
        ) : (
          <p className="text-sm text-destructive">
            Numéro incomplet ou invalide.
          </p>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold">Client & BL</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2 sm:col-span-2">
            <label htmlFor="customerId" className="text-sm font-medium">
              Client <span className="text-destructive">*</span>
            </label>
            <FormSelect
              id="customerId"
              name="customerId"
              required
              placeholder="Choisir un client"
              defaultValue={defaultCustomerId ?? ""}
              options={customers.map((c) => ({
                value: c.id,
                label: `${c.name} (${c.slug})`,
              }))}
            />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <label htmlFor="blReference" className="text-sm font-medium">
              Numéro BL <span className="text-destructive">*</span>
            </label>
            <Input
              id="blReference"
              name="blReference"
              required
              className="font-mono"
              autoFocus={embedded}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="declarationDate" className="text-sm font-medium">
              Date de déclaration
            </label>
            <Input id="declarationDate" name="declarationDate" type="date" />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="title" className="text-sm font-medium">
              Titre (optionnel)
            </label>
            <Input id="title" name="title" />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold">Conteneurs</h2>
        <ContainerNumbersField
          initialContainers={[]}
          initialCount={1}
          onChange={setContainerPayload}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold">Montants (fiche)</h2>
        <p className="text-xs text-muted-foreground">
          Ces montants restent sur la déclaration — ils ne créent pas de
          transaction.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="clientAmountPaid" className="text-sm font-medium">
              Montant client → agence (XOF)
            </label>
            <Input
              id="clientAmountPaid"
              name="clientAmountPaid"
              type="number"
              min={0}
              step={1}
              placeholder="0"
              value={clientAmountPaid}
              onChange={(e) => setClientAmountPaid(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="gaindeDutyAmount" className="text-sm font-medium">
              Droit de douane GAINDE (XOF)
            </label>
            <Input
              id="gaindeDutyAmount"
              name="gaindeDutyAmount"
              type="number"
              min={0}
              step={1}
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
              value={costPrice}
              onChange={(e) => setCostPrice(e.target.value)}
            />
          </div>
          <DeclarationResteField
            clientAmountPaid={clientAmountPaid}
            costPrice={costPrice}
          />
          <div className="flex flex-col gap-2 sm:col-span-2">
            <label htmlFor="payingAgencyId" className="text-sm font-medium">
              Maison-mère (agence)
            </label>
            <FormSelect
              id="payingAgencyId"
              name="payingAgencyId"
              emptyOption="—"
              defaultValue=""
              options={agencies.map((a) => ({ value: a.id, label: a.name }))}
            />
          </div>
        </div>
      </section>

      <div
        className={
          embedded
            ? "flex gap-3 border-t pt-4"
            : "sticky bottom-0 z-10 -mx-4 border-t border-border bg-background/95 px-4 py-3 backdrop-blur md:-mx-0 md:rounded-lg md:border"
        }
      >
        <div className="flex gap-3">
          <Button type="submit" disabled={pending || !previewNumber}>
            {pending ? "Création…" : "Créer la déclaration"}
          </Button>
          {onCancel ? (
            <Button type="button" variant="outline" onClick={onCancel}>
              Annuler
            </Button>
          ) : null}
        </div>
      </div>
    </form>
  );
}
