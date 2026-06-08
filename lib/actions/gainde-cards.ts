"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { MUTATION_ROLES } from "@/lib/auth/permissions";
import { toModuleContext } from "@/lib/auth/module-context";
import { requireRole } from "@/lib/auth/session";
import {
  recordCardDebitSchema,
  recordCardPaymentSchema,
  type RecordCardDebitInput,
  type RecordCardPaymentInput,
} from "@/lib/modules/gainde-cards/schemas";
import {
  recordCardDebit,
  recordCardPayment,
} from "@/lib/modules/gainde-cards/service";
import { actionError, actionOk, type ActionResult } from "./form-result";

function revalidateCartePaths() {
  revalidatePath("/cartes");
  revalidatePath("/declarations");
}

export async function recordCardPaymentAction(
  input: RecordCardPaymentInput,
): Promise<ActionResult<{ id: string }>> {
  const auth = await requireRole([...MUTATION_ROLES]);
  const parsed = recordCardPaymentSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return actionError(first?.message ?? "Données invalides");
  }

  try {
    const amount = BigInt(parsed.data.amount.replace(/\s/g, ""));
    const row = await recordCardPayment(getDb(), toModuleContext(auth), {
      payingAgencyId: parsed.data.payingAgencyId,
      amount,
      effectiveDate: parsed.data.effectiveDate,
      label: parsed.data.label,
      notes: parsed.data.notes,
    });
    revalidateCartePaths();
    return actionOk({ id: row.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return actionError(message);
  }
}

export async function recordCardDebitAction(
  input: RecordCardDebitInput,
): Promise<ActionResult<{ id: string }>> {
  const auth = await requireRole([...MUTATION_ROLES]);
  const parsed = recordCardDebitSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return actionError(first?.message ?? "Données invalides");
  }

  try {
    const amount = BigInt(parsed.data.amount.replace(/\s/g, ""));
    const row = await recordCardDebit(getDb(), toModuleContext(auth), {
      payingAgencyId: parsed.data.payingAgencyId,
      debitTypeId: parsed.data.debitTypeId,
      amount,
      effectiveDate: parsed.data.effectiveDate,
      label: parsed.data.label,
      notes: parsed.data.notes,
    });
    revalidateCartePaths();
    return actionOk({ id: row.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return actionError(message);
  }
}

/** @deprecated use recordCardPaymentAction */
export const recordCardLoadAction = recordCardPaymentAction;
