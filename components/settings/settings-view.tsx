"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, RotateCcw } from "lucide-react";
import {
  createAgencyAction,
  updateAgencyAction,
} from "@/lib/actions/agencies";
import {
  createTransactionTypeAction,
  setTransactionTypeActiveAction,
  updateTransactionTypeAction,
} from "@/lib/actions/transaction-types";
import { createZoneAction, updateZoneAction } from "@/lib/actions/zones";
import type { BalanceSide } from "@/lib/db/enums";
import type { OrganizationZoneRow } from "@/lib/modules/zones/service";
import type { TransactionTypeRow } from "@/lib/modules/ledger/transaction-types";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-feedback";
import { FormSelect } from "@/components/ui/form-select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

type AgencyRow = {
  id: string;
  name: string;
  notes: string | null;
  isActive: boolean;
};

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}

function ConfigList({
  children,
  empty,
}: {
  children: React.ReactNode;
  empty?: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      {empty}
      <ul className="divide-y">{children}</ul>
    </div>
  );
}

function balanceSideLabel(side: BalanceSide) {
  return side === "credit" ? "Crédit" : "Débit";
}

export function SettingsView({
  agencies: initialAgencies,
  zones: initialZones,
  transactionTypes: initialTypes,
  canEditOrg,
  canEditLedger,
}: {
  agencies: AgencyRow[];
  zones: OrganizationZoneRow[];
  transactionTypes: TransactionTypeRow[];
  canEditOrg: boolean;
  canEditLedger: boolean;
}) {
  const router = useRouter();
  const [agencies, setAgencies] = useState(initialAgencies);
  const [zones, setZones] = useState(initialZones);
  const [types, setTypes] = useState(initialTypes);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const [newAgencyName, setNewAgencyName] = useState("");
  const [newAgencyNotes, setNewAgencyNotes] = useState("");
  const [editingAgencyId, setEditingAgencyId] = useState<string | null>(null);
  const [editingAgencyName, setEditingAgencyName] = useState("");

  const [newZoneSlug, setNewZoneSlug] = useState("");
  const [newZoneLabel, setNewZoneLabel] = useState("");
  const [editingZoneId, setEditingZoneId] = useState<string | null>(null);
  const [editingZoneLabel, setEditingZoneLabel] = useState("");

  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeSide, setNewTypeSide] = useState<BalanceSide>("debit");
  const [editingTypeId, setEditingTypeId] = useState<string | null>(null);
  const [editingTypeName, setEditingTypeName] = useState("");

  function refresh() {
    router.refresh();
  }

  async function handleCreateAgency(event: React.FormEvent) {
    event.preventDefault();
    if (!canEditOrg || !newAgencyName.trim()) return;
    setPending(true);
    setError(null);
    const result = await createAgencyAction({
      name: newAgencyName.trim(),
      notes: newAgencyNotes.trim() || undefined,
    });
    setPending(false);
    if (!result.ok || !result.data) {
      setError(result.ok ? "Réponse invalide." : result.error);
      return;
    }
    setAgencies((prev) =>
      [...prev, { id: result.data!.id, name: result.data!.name, notes: newAgencyNotes.trim() || null, isActive: true }].sort(
        (a, b) => a.name.localeCompare(b.name, "fr"),
      ),
    );
    setNewAgencyName("");
    setNewAgencyNotes("");
    refresh();
  }

  async function handleSaveAgency(agencyId: string) {
    const name = editingAgencyName.trim();
    if (!canEditOrg || !name) return;
    setPending(true);
    setError(null);
    const result = await updateAgencyAction({ agencyId, name });
    setPending(false);
    if (!result.ok || !result.data) {
      setError(result.ok ? "Réponse invalide." : result.error);
      return;
    }
    setAgencies((prev) =>
      prev
        .map((a) => (a.id === agencyId ? { ...a, name: result.data!.name } : a))
        .sort((a, b) => a.name.localeCompare(b.name, "fr")),
    );
    setEditingAgencyId(null);
    refresh();
  }

  async function handleToggleAgency(agency: AgencyRow, active: boolean) {
    if (!canEditOrg) return;
    setPending(true);
    setError(null);
    const result = await updateAgencyAction({
      agencyId: agency.id,
      isActive: active,
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setAgencies((prev) =>
      prev.map((a) =>
        a.id === agency.id ? { ...a, isActive: result.data!.isActive } : a,
      ),
    );
    refresh();
  }

  async function handleCreateZone(event: React.FormEvent) {
    event.preventDefault();
    if (!canEditOrg || !newZoneSlug.trim() || !newZoneLabel.trim()) return;
    setPending(true);
    setError(null);
    const result = await createZoneAction({
      slug: newZoneSlug.trim(),
      label: newZoneLabel.trim(),
    });
    setPending(false);
    if (!result.ok || !result.data) {
      setError(result.ok ? "Réponse invalide." : result.error);
      return;
    }
    setZones((prev) => [...prev, result.data!]);
    setNewZoneSlug("");
    setNewZoneLabel("");
    refresh();
  }

  async function handleSaveZone(zoneId: string) {
    const label = editingZoneLabel.trim();
    if (!canEditOrg || !label) return;
    setPending(true);
    setError(null);
    const result = await updateZoneAction({ zoneId, label });
    setPending(false);
    if (!result.ok || !result.data) {
      setError(result.ok ? "Réponse invalide." : result.error);
      return;
    }
    setZones((prev) =>
      prev.map((z) => (z.id === zoneId ? result.data! : z)),
    );
    setEditingZoneId(null);
    refresh();
  }

  async function handleToggleZone(zone: OrganizationZoneRow, active: boolean) {
    if (!canEditOrg) return;
    setPending(true);
    setError(null);
    const result = await updateZoneAction({
      zoneId: zone.id,
      isActive: active,
    });
    setPending(false);
    if (!result.ok || !result.data) {
      setError(result.ok ? "Réponse invalide." : result.error);
      return;
    }
    setZones((prev) =>
      prev.map((z) => (z.id === zone.id ? result.data! : z)),
    );
    refresh();
  }

  async function handleCreateType(event: React.FormEvent) {
    event.preventDefault();
    if (!canEditLedger || !newTypeName.trim()) return;
    setPending(true);
    setError(null);
    const result = await createTransactionTypeAction({
      name: newTypeName.trim(),
      balanceSide: newTypeSide,
    });
    setPending(false);
    if (!result.ok || !result.data) {
      setError(result.ok ? "Réponse invalide." : result.error);
      return;
    }
    setTypes((prev) =>
      [...prev, result.data!].sort((a, b) => a.sortOrder - b.sortOrder),
    );
    setNewTypeName("");
    refresh();
  }

  async function handleSaveType(typeId: string) {
    const name = editingTypeName.trim();
    if (!canEditLedger || !name) return;
    setPending(true);
    setError(null);
    const result = await updateTransactionTypeAction({
      transactionTypeId: typeId,
      name,
    });
    setPending(false);
    if (!result.ok || !result.data) {
      setError(result.ok ? "Réponse invalide." : result.error);
      return;
    }
    setTypes((prev) =>
      prev.map((t) => (t.id === typeId ? result.data! : t)),
    );
    setEditingTypeId(null);
    refresh();
  }

  async function handleToggleType(type: TransactionTypeRow, active: boolean) {
    if (!canEditLedger || type.isSystem) return;
    setPending(true);
    setError(null);
    const result = await setTransactionTypeActiveAction({
      transactionTypeId: type.id,
      active,
    });
    setPending(false);
    if (!result.ok || !result.data) {
      setError(result.ok ? "Réponse invalide." : result.error);
      return;
    }
    setTypes((prev) =>
      prev.map((t) => (t.id === type.id ? result.data! : t)),
    );
    refresh();
  }

  return (
    <div className="space-y-10">
      {!canEditOrg && !canEditLedger ? (
        <FormAlert variant="info">
          Lecture seule — contactez un administrateur pour modifier ces listes.
        </FormAlert>
      ) : null}

      {error ? <FormAlert variant="error">{error}</FormAlert> : null}

      <SettingsSection
        title="Agences (maison-mère)"
        description="Utilisées comme agence payeur GAINDE sur les déclarations."
      >
        <ConfigList
          empty={
            agencies.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                Aucune agence.
              </p>
            ) : null
          }
        >
          {agencies.map((agency) => (
            <li
              key={agency.id}
              className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1 space-y-0.5">
                {editingAgencyId === agency.id ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      value={editingAgencyName}
                      onChange={(e) => setEditingAgencyName(e.target.value)}
                      className="h-8 max-w-xs"
                      disabled={pending}
                    />
                    <Button
                      type="button"
                      size="sm"
                      disabled={pending}
                      onClick={() => void handleSaveAgency(agency.id)}
                    >
                      Enregistrer
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingAgencyId(null)}
                    >
                      Annuler
                    </Button>
                  </div>
                ) : (
                  <>
                    <p
                      className={cn(
                        "font-medium",
                        !agency.isActive && "text-muted-foreground line-through",
                      )}
                    >
                      {agency.name}
                    </p>
                    {agency.notes ? (
                      <p className="text-xs text-muted-foreground">{agency.notes}</p>
                    ) : null}
                  </>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {canEditOrg && editingAgencyId !== agency.id ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1"
                    onClick={() => {
                      setEditingAgencyId(agency.id);
                      setEditingAgencyName(agency.name);
                    }}
                  >
                    <Pencil className="size-3.5" aria-hidden />
                    Renommer
                  </Button>
                ) : null}
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Switch
                    checked={agency.isActive}
                    disabled={!canEditOrg || pending}
                    onCheckedChange={(checked) =>
                      void handleToggleAgency(agency, checked)
                    }
                  />
                  Active
                </label>
              </div>
            </li>
          ))}
        </ConfigList>

        {canEditOrg ? (
          <form
            onSubmit={(e) => void handleCreateAgency(e)}
            className="flex flex-col gap-3 rounded-lg border border-dashed bg-muted/20 p-4 sm:flex-row sm:flex-wrap sm:items-end"
          >
            <div className="min-w-[12rem] flex-1 space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Nouvelle agence
              </label>
              <Input
                value={newAgencyName}
                onChange={(e) => setNewAgencyName(e.target.value)}
                placeholder="Ex. Agence principale"
                disabled={pending}
                required
              />
            </div>
            <div className="min-w-[12rem] flex-1 space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Notes (optionnel)
              </label>
              <Input
                value={newAgencyNotes}
                onChange={(e) => setNewAgencyNotes(e.target.value)}
                placeholder="Carte GAINDE…"
                disabled={pending}
              />
            </div>
            <Button type="submit" size="sm" className="gap-1" disabled={pending}>
              <Plus className="size-3.5" aria-hidden />
              Ajouter
            </Button>
          </form>
        ) : null}
      </SettingsSection>

      <SettingsSection
        title="Zones / terminaux"
        description="Codes utilisés dans les numéros de déclaration (ex. 18N, DPW)."
      >
        <ConfigList
          empty={
            zones.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                Aucune zone.
              </p>
            ) : null
          }
        >
          {zones.map((zone) => (
            <li
              key={zone.id}
              className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                {editingZoneId === zone.id ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm text-muted-foreground">
                      {zone.slug}
                    </span>
                    <Input
                      value={editingZoneLabel}
                      onChange={(e) => setEditingZoneLabel(e.target.value)}
                      className="h-8 max-w-sm"
                      disabled={pending}
                    />
                    <Button
                      type="button"
                      size="sm"
                      disabled={pending}
                      onClick={() => void handleSaveZone(zone.id)}
                    >
                      Enregistrer
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingZoneId(null)}
                    >
                      Annuler
                    </Button>
                  </div>
                ) : (
                  <p
                    className={cn(
                      "text-sm",
                      !zone.isActive && "text-muted-foreground line-through",
                    )}
                  >
                    <span className="font-mono font-medium">{zone.slug}</span>
                    <span className="text-muted-foreground"> — {zone.label}</span>
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {canEditOrg && editingZoneId !== zone.id ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1"
                    onClick={() => {
                      setEditingZoneId(zone.id);
                      setEditingZoneLabel(zone.label);
                    }}
                  >
                    <Pencil className="size-3.5" aria-hidden />
                    Libellé
                  </Button>
                ) : null}
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Switch
                    checked={zone.isActive}
                    disabled={!canEditOrg || pending}
                    onCheckedChange={(checked) =>
                      void handleToggleZone(zone, checked)
                    }
                  />
                  Active
                </label>
              </div>
            </li>
          ))}
        </ConfigList>

        {canEditOrg ? (
          <form
            onSubmit={(e) => void handleCreateZone(e)}
            className="flex flex-col gap-3 rounded-lg border border-dashed bg-muted/20 p-4 sm:flex-row sm:flex-wrap sm:items-end"
          >
            <div className="w-28 space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Code
              </label>
              <Input
                value={newZoneSlug}
                onChange={(e) => setNewZoneSlug(e.target.value.toUpperCase())}
                placeholder="18N"
                className="font-mono"
                disabled={pending}
                required
              />
            </div>
            <div className="min-w-[12rem] flex-1 space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Libellé
              </label>
              <Input
                value={newZoneLabel}
                onChange={(e) => setNewZoneLabel(e.target.value)}
                placeholder="18N — zone portuaire"
                disabled={pending}
                required
              />
            </div>
            <Button type="submit" size="sm" className="gap-1" disabled={pending}>
              <Plus className="size-3.5" aria-hidden />
              Ajouter
            </Button>
          </form>
        ) : null}
      </SettingsSection>

      <SettingsSection
        title="Types de transaction"
        description="Versements, charges et types personnalisés pour le journal. Les types système ne peuvent pas être désactivés."
      >
        <ConfigList>
          {types.map((type) => (
            <li
              key={type.id}
              className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                {editingTypeId === type.id ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      value={editingTypeName}
                      onChange={(e) => setEditingTypeName(e.target.value)}
                      className="h-8 max-w-xs"
                      disabled={pending}
                    />
                    <Button
                      type="button"
                      size="sm"
                      disabled={pending}
                      onClick={() => void handleSaveType(type.id)}
                    >
                      Enregistrer
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingTypeId(null)}
                    >
                      Annuler
                    </Button>
                  </div>
                ) : (
                  <p
                    className={cn(
                      "font-medium",
                      !type.active && "text-muted-foreground line-through",
                    )}
                  >
                    {type.name}
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      {balanceSideLabel(type.balanceSide)}
                      {type.isSystem ? " · système" : ""}
                    </span>
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {canEditLedger && editingTypeId !== type.id ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1"
                    onClick={() => {
                      setEditingTypeId(type.id);
                      setEditingTypeName(type.name);
                    }}
                  >
                    <Pencil className="size-3.5" aria-hidden />
                    Renommer
                  </Button>
                ) : null}
                {!type.isSystem ? (
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Switch
                      checked={type.active}
                      disabled={!canEditLedger || pending}
                      onCheckedChange={(checked) =>
                        void handleToggleType(type, checked)
                      }
                    />
                    Active
                  </label>
                ) : (
                  <span className="text-xs text-muted-foreground">Toujours actif</span>
                )}
              </div>
            </li>
          ))}
        </ConfigList>

        {canEditLedger ? (
          <form
            onSubmit={(e) => void handleCreateType(e)}
            className="flex flex-col gap-3 rounded-lg border border-dashed bg-muted/20 p-4 sm:flex-row sm:flex-wrap sm:items-end"
          >
            <div className="min-w-[12rem] flex-1 space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Nouveau type
              </label>
              <Input
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                placeholder="Ex. Frais dossier"
                disabled={pending}
                required
              />
            </div>
            <div className="w-40 space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Sens
              </label>
              <FormSelect
                value={newTypeSide}
                onValueChange={(v) => setNewTypeSide(v as BalanceSide)}
                options={[
                  { value: "debit", label: "Débit (charge)" },
                  { value: "credit", label: "Crédit (versement)" },
                ]}
                disabled={pending}
              />
            </div>
            <Button type="submit" size="sm" className="gap-1" disabled={pending}>
              <Plus className="size-3.5" aria-hidden />
              Ajouter
            </Button>
          </form>
        ) : null}
      </SettingsSection>

      {canEditOrg || canEditLedger ? (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => refresh()}
            disabled={pending}
          >
            <RotateCcw className="size-3.5" aria-hidden />
            Actualiser
          </Button>
        </div>
      ) : null}
    </div>
  );
}
