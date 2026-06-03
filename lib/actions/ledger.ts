"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { toModuleContext } from "@/lib/auth/module-context";
import { LEDGER_MUTATION_ROLES } from "@/lib/auth/permissions";
import { requireRole } from "@/lib/auth/session";
import { OrgScopeError } from "@/lib/modules/shared/org-refs";
import {
  AllocationValidationError,
  recordCharge,
  recordVersement,
} from "@/lib/modules/ledger/service";
import {
  recordChargeBodySchema,
  recordVersementBodySchema,
  type RecordChargeBodyValues,
  type RecordVersementBodyValues,
} from "@/lib/modules/ledger/schemas";
import { actionError, actionOk, type ActionResult } from "./form-result";

const customerIdParam = z.string().uuid("Client invalide.");

function revalidateCustomer(customerId: string) {
  revalidatePath("/clients");
  revalidatePath(`/clients/${customerId}`);
}

export async function recordVersementAction(
  customerId: string,
  input: RecordVersementBodyValues,
): Promise<ActionResult<{ id: string }>> {
  const auth = await requireRole([...LEDGER_MUTATION_ROLES]);

  const idParsed = customerIdParam.safeParse(customerId);
  if (!idParsed.success) {
    return actionError("Client invalide.");
  }

  const bodyParsed = recordVersementBodySchema.safeParse(input);
  if (!bodyParsed.success) {
    const first = bodyParsed.error.issues[0];
    return actionError(first?.message ?? "Données invalides");
  }

  try {
    const entry = await recordVersement(getDb(), toModuleContext(auth), {
      customerId: idParsed.data,
      ...bodyParsed.data,
    });
    revalidateCustomer(idParsed.data);
    return actionOk({ id: entry.id });
  } catch (err) {
    if (err instanceof AllocationValidationError) {
      return actionError(err.message);
    }
    if (err instanceof OrgScopeError) return actionError(err.message);
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return actionError(message);
  }
}

export async function recordChargeAction(
  customerId: string,
  input: RecordChargeBodyValues,
): Promise<ActionResult<{ id: string }>> {
  const auth = await requireRole([...LEDGER_MUTATION_ROLES]);

  const idParsed = customerIdParam.safeParse(customerId);
  if (!idParsed.success) {
    return actionError("Client invalide.");
  }

  const bodyParsed = recordChargeBodySchema.safeParse(input);
  if (!bodyParsed.success) {
    const first = bodyParsed.error.issues[0];
    return actionError(first?.message ?? "Données invalides");
  }

  try {
    const entry = await recordCharge(getDb(), toModuleContext(auth), {
      customerId: idParsed.data,
      ...bodyParsed.data,
    });
    revalidateCustomer(idParsed.data);
    return actionOk({ id: entry.id });
  } catch (err) {
    if (err instanceof OrgScopeError) return actionError(err.message);
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return actionError(message);
  }
}
