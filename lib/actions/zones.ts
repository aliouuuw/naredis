"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { toModuleContext } from "@/lib/auth/module-context";
import { MUTATION_ROLES } from "@/lib/auth/permissions";
import { requireRole } from "@/lib/auth/session";
import {
  createZoneSchema,
  updateZoneSchema,
  type CreateZoneInput,
  type UpdateZoneInput,
} from "@/lib/modules/zones/schemas";
import {
  createZone,
  updateZone,
  type OrganizationZoneRow,
} from "@/lib/modules/zones/service";
import { actionError, actionOk, type ActionResult } from "./form-result";

function revalidateZonePaths() {
  revalidatePath("/settings");
  revalidatePath("/declarations");
  revalidatePath("/cartes");
}

export async function createZoneAction(
  input: CreateZoneInput,
): Promise<ActionResult<OrganizationZoneRow>> {
  const auth = await requireRole([...MUTATION_ROLES]);
  const parsed = createZoneSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return actionError(first?.message ?? "Données invalides");
  }

  try {
    const row = await createZone(getDb(), toModuleContext(auth), parsed.data);
    revalidateZonePaths();
    return actionOk(row);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    if (message.includes("unique") || message.includes("duplicate")) {
      return actionError("Ce code zone existe déjà.");
    }
    return actionError(message);
  }
}

export async function updateZoneAction(
  input: UpdateZoneInput,
): Promise<ActionResult<OrganizationZoneRow>> {
  const auth = await requireRole([...MUTATION_ROLES]);
  const parsed = updateZoneSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return actionError(first?.message ?? "Données invalides");
  }

  const { zoneId, defaultPayingAgencyId, ...rest } = parsed.data;
  const row = await updateZone(getDb(), toModuleContext(auth), zoneId, {
    ...rest,
    ...(defaultPayingAgencyId !== undefined
      ? {
          defaultPayingAgencyId:
            defaultPayingAgencyId === "" ? null : defaultPayingAgencyId,
        }
      : {}),
  });
  if (!row) {
    return actionError("Zone introuvable.");
  }

  revalidateZonePaths();
  return actionOk(row);
}
