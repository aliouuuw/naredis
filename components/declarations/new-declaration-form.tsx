"use client";

import { useState } from "react";
import { createDeclarationAction } from "@/lib/actions/declarations";
import { ContainerNumbersField } from "@/components/declarations/container-numbers-field";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-feedback";
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

  const hasCustomers = customers.length > 0;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setSuccess(null);

    const form = new FormData(event.currentTarget);

    const result = await createDeclarationAction({
      customerId: String(form.get("customerId") ?? ""),
      blReference: String(form.get("blReference") ?? ""),
      zoneOrTerminal: String(form.get("zoneOrTerminal") ?? "") || undefined,
      declarationDate: String(form.get("declarationDate") ?? "") || undefined,
      containerCount: containerPayload.containerCount,
      containers: containerPayload.containers,
      clientAmountPaid: parseMoney(String(form.get("clientAmountPaid") ?? "")),
      gaindeDutyAmount: parseMoney(String(form.get("gaindeDutyAmount") ?? "")),
      costPrice: parseMoney(String(form.get("costPrice") ?? "")),
      payingAgencyId: String(form.get("payingAgencyId") ?? ""),
      dossierType:
        (form.get("dossierType") as "import" | "export" | "transit") || "import",
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
        <h2 className="text-sm font-semibold">Client & BL</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2 sm:col-span-2">
            <label htmlFor="customerId" className="text-sm font-medium">
              Client <span className="text-destructive">*</span>
            </label>
            <select
              id="customerId"
              name="customerId"
              required
              className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
              defaultValue={defaultCustomerId ?? ""}
            >
              <option value="" disabled>
                Choisir un client
              </option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.slug})
                </option>
              ))}
            </select>
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
            <label htmlFor="dossierType" className="text-sm font-medium">
              Type
            </label>
            <select
              id="dossierType"
              name="dossierType"
              className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
              defaultValue="import"
            >
              <option value="import">Import</option>
              <option value="export">Export</option>
              <option value="transit">Transit</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="declarationDate" className="text-sm font-medium">
              Date de déclaration
            </label>
            <Input id="declarationDate" name="declarationDate" type="date" />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <label htmlFor="zoneOrTerminal" className="text-sm font-medium">
              Zone / terminal
            </label>
            <Input id="zoneOrTerminal" name="zoneOrTerminal" />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
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
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="payingAgencyId" className="text-sm font-medium">
              Maison-mère (agence)
            </label>
            <select
              id="payingAgencyId"
              name="payingAgencyId"
              className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
              defaultValue=""
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
          embedded
            ? "flex gap-3 border-t pt-4"
            : "sticky bottom-0 z-10 -mx-4 border-t border-border bg-background/95 px-4 py-3 backdrop-blur md:-mx-0 md:rounded-lg md:border"
        }
      >
        <div className="flex gap-3">
          <Button type="submit" disabled={pending}>
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
