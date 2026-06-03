"use server";

import { getDb } from "@/lib/db";
import { toModuleContext } from "@/lib/auth/module-context";
import { requireAuthContext } from "@/lib/auth/session";
import type { DeclarationFicheSerialized } from "@/lib/modules/declarations/serialize-fiche";
import { listAgencies } from "@/lib/modules/agencies/service";
import {
  getDeclarationById,
  listDeclarationEditLog,
} from "@/lib/modules/declarations/service";
import { actionError, actionOk, type ActionResult } from "./form-result";

function moneyToInput(value: bigint | null): string {
  if (value == null) return "";
  return value.toString();
}

export async function getDeclarationFicheAction(
  declarationId: string,
): Promise<ActionResult<DeclarationFicheSerialized>> {
  const auth = await requireAuthContext();
  const ctx = toModuleContext(auth);
  const db = getDb();

  const [data, editLog] = await Promise.all([
    getDeclarationById(db, ctx, declarationId),
    listDeclarationEditLog(db, ctx, declarationId),
  ]);

  if (!data) {
    return actionError("Déclaration introuvable.");
  }

  const { declaration, dossier, customer, containers, payingAgencyName } = data;

  return actionOk({
    declarationId: declaration.id,
    formKey: `${declaration.id}-${declaration.updatedAt.toISOString()}`,
    declarationNumber: declaration.declarationNumber,
    bonADelivrer: declaration.bonADelivrer,
    dossier: {
      id: dossier.id,
      dossierNumber: dossier.dossierNumber,
      blReference: dossier.blReference,
    },
    customer: { id: customer.id, name: customer.name, slug: customer.slug },
    payingAgencyName,
    amounts: {
      clientAmountPaid: moneyToInput(declaration.clientAmountPaid),
      gaindeDutyAmount: moneyToInput(declaration.gaindeDutyAmount),
      costPrice: moneyToInput(declaration.costPrice),
    },
    editInitial: {
      declarationId: declaration.id,
      blReference: dossier.blReference ?? "",
      zoneOrTerminal: declaration.zoneOrTerminal ?? "",
      declarationDate: declaration.declarationDate ?? "",
      containerCount: declaration.containerCount ?? containers.length,
      containers,
      clientAmountPaid: moneyToInput(declaration.clientAmountPaid),
      gaindeDutyAmount: moneyToInput(declaration.gaindeDutyAmount),
      costPrice: moneyToInput(declaration.costPrice),
      payingAgencyId: declaration.payingAgencyId ?? "",
      customsReference: declaration.customsReference ?? "",
      bureau: declaration.bureau ?? "",
      bonADelivrer: declaration.bonADelivrer,
    },
    editLog: editLog.map((entry) => ({
      id: entry.id,
      changes: entry.changes,
      changedBy: entry.changedBy,
      changedAt: entry.changedAt.toISOString(),
    })),
  });
}

export type AgencyOptionSerialized = { id: string; name: string };

export async function listAgenciesForFormAction(): Promise<
  ActionResult<AgencyOptionSerialized[]>
> {
  const auth = await requireAuthContext();
  const rows = await listAgencies(getDb(), toModuleContext(auth));
  return actionOk(rows.map((a) => ({ id: a.id, name: a.name })));
}
