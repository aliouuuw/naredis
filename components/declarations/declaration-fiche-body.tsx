"use client";

import { DeclarationFicheTabs } from "@/components/declarations/declaration-fiche-tabs";
import type { AgencyOption } from "@/components/declarations/new-declaration-form";
import type { DeclarationFicheSerialized } from "@/lib/modules/declarations/serialize-fiche";
import { FormAlert } from "@/components/ui/form-feedback";
import { Skeleton } from "@/components/ui/skeleton";

export function DeclarationFicheBody({
  loading,
  error,
  fiche,
  agencies,
  canEdit,
  variant,
  onSaved,
}: {
  loading: boolean;
  error: string | null;
  fiche: DeclarationFicheSerialized | null;
  agencies: AgencyOption[];
  canEdit: boolean;
  variant: "sheet" | "page";
  onSaved?: () => void;
}) {
  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error) {
    return <FormAlert variant="error">{error}</FormAlert>;
  }

  if (!fiche) {
    return null;
  }

  return (
    <DeclarationFicheTabs
      variant={variant}
      declarationNumber={fiche.declarationNumber}
      bonADelivrer={fiche.bonADelivrer}
      dossier={fiche.dossier}
      customer={fiche.customer}
      payingAgencyName={fiche.payingAgencyName}
      amounts={{
        clientAmountPaid: fiche.amounts.clientAmountPaid
          ? BigInt(fiche.amounts.clientAmountPaid)
          : null,
        gaindeDutyAmount: fiche.amounts.gaindeDutyAmount
          ? BigInt(fiche.amounts.gaindeDutyAmount)
          : null,
        costPrice: fiche.amounts.costPrice
          ? BigInt(fiche.amounts.costPrice)
          : null,
      }}
      editInitial={fiche.editInitial}
      agencies={agencies}
      editLog={fiche.editLog}
      activityLog={fiche.activityLog}
      canEdit={canEdit}
      formKey={fiche.formKey}
      onSaved={onSaved}
    />
  );
}
