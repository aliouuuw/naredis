"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { createDeclarationAction } from "@/lib/actions/declarations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type CustomerOption = { id: string; name: string; slug: string };
export type AgencyOption = { id: string; name: string };

function parseMoney(value: string): string | undefined {
  const trimmed = value.replace(/\s/g, "");
  if (!trimmed) return undefined;
  return trimmed;
}

function parseContainers(text: string): string[] {
  return text
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function NewDeclarationForm({
  customers,
  agencies,
}: {
  customers: CustomerOption[];
  agencies: AgencyOption[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [containerCount, setContainerCount] = useState(1);

  const hasCustomers = customers.length > 0;

  const containerHint = useMemo(() => {
    if (containerCount <= 0) return "Indiquez le nombre de conteneurs.";
    return `${containerCount} numéro(s) attendu(s), un par ligne.`;
  }, [containerCount]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const containers = parseContainers(String(form.get("containers") ?? ""));

    const result = await createDeclarationAction({
      customerId: String(form.get("customerId") ?? ""),
      blReference: String(form.get("blReference") ?? ""),
      zoneOrTerminal: String(form.get("zoneOrTerminal") ?? "") || undefined,
      declarationDate: String(form.get("declarationDate") ?? "") || undefined,
      containerCount: Number(form.get("containerCount") ?? 0),
      containers,
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

    router.push(`/declarations/${result.data!.id}`);
    router.refresh();
  }

  if (!hasCustomers) {
    return (
      <p className="text-sm text-muted-foreground">
        Créez d&apos;abord un{" "}
        <a href="/clients/new" className="font-medium text-foreground underline">
          client
        </a>{" "}
        avant d&apos;ouvrir une déclaration.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-2xl flex-col gap-6">
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
              defaultValue=""
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
            <Input id="blReference" name="blReference" required className="font-mono" />
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
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="containerCount" className="text-sm font-medium">
              Nombre de conteneurs
            </label>
            <Input
              id="containerCount"
              name="containerCount"
              type="number"
              min={0}
              value={containerCount}
              onChange={(e) => setContainerCount(Number(e.target.value) || 0)}
            />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="containers" className="text-sm font-medium">
            Numéros de conteneurs
          </label>
          <textarea
            id="containers"
            name="containers"
            rows={Math.max(2, Math.min(containerCount, 6))}
            placeholder="MSCU1234567&#10;MSCU7654321"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">{containerHint}</p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold">Montants (fiche)</h2>
        <p className="text-xs text-muted-foreground">
          Ces montants restent sur la déclaration — ils ne créent pas de transaction.
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

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Création…" : "Créer la déclaration"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Annuler
        </Button>
      </div>
    </form>
  );
}
