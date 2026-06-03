"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { toModuleContext } from "@/lib/auth/module-context";
import { MUTATION_ROLES } from "@/lib/auth/permissions";
import { requireRole } from "@/lib/auth/session";
import {
  createAgencySchema,
  updateAgencySchema,
  type CreateAgencyInput,
  type UpdateAgencyInput,
} from "@/lib/modules/agencies/schemas";
import {
  createAgency,
  updateAgency,
} from "@/lib/modules/agencies/service";
import { actionError, actionOk, type ActionResult } from "./form-result";

function revalidateAgencyPaths() {
  revalidatePath("/settings");
  revalidatePath("/declarations");
}

export async function createAgencyAction(
  input: CreateAgencyInput,
): Promise<ActionResult<{ id: string; name: string }>> {
  const auth = await requireRole([...MUTATION_ROLES]);
  const parsed = createAgencySchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return actionError(first?.message ?? "Données invalides");
  }

  try {
    const row = await createAgency(getDb(), toModuleContext(auth), parsed.data);
    revalidateAgencyPaths();
    return actionOk({ id: row.id, name: row.name });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    if (message.includes("unique") || message.includes("duplicate")) {
      return actionError("Une agence avec ce nom existe déjà.");
    }
    return actionError(message);
  }
}

export async function updateAgencyAction(
  input: UpdateAgencyInput,
): Promise<ActionResult<{ id: string; name: string; isActive: boolean }>> {
  const auth = await requireRole([...MUTATION_ROLES]);
  const parsed = updateAgencySchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return actionError(first?.message ?? "Données invalides");
  }

  const { agencyId, ...patch } = parsed.data;
  const row = await updateAgency(getDb(), toModuleContext(auth), agencyId, patch);
  if (!row) {
    return actionError("Agence introuvable.");
  }

  revalidateAgencyPaths();
  return actionOk({ id: row.id, name: row.name, isActive: row.isActive });
}
