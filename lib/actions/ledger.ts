"use server";

import { revalidatePath } from "next/cache";
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
  recordChargeSchema,
  recordVersementSchema,
  type RecordChargeFormValues,
  type RecordVersementFormValues,
} from "@/lib/modules/ledger/schemas";
import { actionError, actionOk, type ActionResult } from "./form-result";

function revalidateCustomer(customerId: string) {
  revalidatePath("/clients");
  revalidatePath(`/clients/${customerId}`);
}

export async function recordVersementAction(
  input: RecordVersementFormValues,
): Promise<ActionResult<{ id: string }>> {
  const auth = await requireRole([...LEDGER_MUTATION_ROLES]);
  const parsed = recordVersementSchema.safeParse(input);

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return actionError(first?.message ?? "Données invalides");
  }

  try {
    const entry = await recordVersement(
      getDb(),
      toModuleContext(auth),
      parsed.data,
    );
    revalidateCustomer(parsed.data.customerId);
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
  input: RecordChargeFormValues,
): Promise<ActionResult<{ id: string }>> {
  const auth = await requireRole([...LEDGER_MUTATION_ROLES]);
  const parsed = recordChargeSchema.safeParse(input);

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return actionError(first?.message ?? "Données invalides");
  }

  try {
    const entry = await recordCharge(
      getDb(),
      toModuleContext(auth),
      parsed.data,
    );
    revalidateCustomer(parsed.data.customerId);
    return actionOk({ id: entry.id });
  } catch (err) {
    if (err instanceof OrgScopeError) return actionError(err.message);
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return actionError(message);
  }
}
