"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { MUTATION_ROLES } from "@/lib/auth/permissions";
import { toModuleContext } from "@/lib/auth/module-context";
import { requireRole } from "@/lib/auth/session";
import {
  createGaindeCardDebitTypeSchema,
  setGaindeCardDebitTypeActiveSchema,
  updateGaindeCardDebitTypeSchema,
  type CreateGaindeCardDebitTypeInput,
  type SetGaindeCardDebitTypeActiveInput,
  type UpdateGaindeCardDebitTypeInput,
} from "@/lib/modules/gainde-cards/debit-type-schemas";
import {
  createGaindeCardDebitType,
  setGaindeCardDebitTypeActive,
  updateGaindeCardDebitType,
  type GaindeCardDebitTypeRow,
} from "@/lib/modules/gainde-cards/debit-types";
import { actionError, actionOk, type ActionResult } from "./form-result";

function revalidateDebitTypes() {
  revalidatePath("/settings");
  revalidatePath("/cartes");
}

export async function createGaindeCardDebitTypeAction(
  input: CreateGaindeCardDebitTypeInput,
): Promise<ActionResult<GaindeCardDebitTypeRow>> {
  const auth = await requireRole([...MUTATION_ROLES]);
  const parsed = createGaindeCardDebitTypeSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return actionError(first?.message ?? "Données invalides");
  }

  try {
    const row = await createGaindeCardDebitType(
      getDb(),
      toModuleContext(auth),
      parsed.data,
    );
    revalidateDebitTypes();
    return actionOk(row);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return actionError(message);
  }
}

export async function updateGaindeCardDebitTypeAction(
  input: UpdateGaindeCardDebitTypeInput,
): Promise<ActionResult<GaindeCardDebitTypeRow>> {
  const auth = await requireRole([...MUTATION_ROLES]);
  const parsed = updateGaindeCardDebitTypeSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return actionError(first?.message ?? "Données invalides");
  }

  try {
    const row = await updateGaindeCardDebitType(
      getDb(),
      toModuleContext(auth),
      parsed.data.debitTypeId,
      { name: parsed.data.name },
    );
    revalidateDebitTypes();
    return actionOk(row);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return actionError(message);
  }
}

export async function setGaindeCardDebitTypeActiveAction(
  input: SetGaindeCardDebitTypeActiveInput,
): Promise<ActionResult<GaindeCardDebitTypeRow>> {
  const auth = await requireRole([...MUTATION_ROLES]);
  const parsed = setGaindeCardDebitTypeActiveSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return actionError(first?.message ?? "Données invalides");
  }

  try {
    const row = await setGaindeCardDebitTypeActive(
      getDb(),
      toModuleContext(auth),
      parsed.data.debitTypeId,
      parsed.data.active,
    );
    revalidateDebitTypes();
    return actionOk(row);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return actionError(message);
  }
}
