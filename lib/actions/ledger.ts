"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { toModuleContext } from "@/lib/auth/module-context";
import { LEDGER_MUTATION_ROLES } from "@/lib/auth/permissions";
import { requireRole } from "@/lib/auth/session";
import { OrgScopeError } from "@/lib/modules/shared/org-refs";
import {
  LedgerCorrectionError,
  recordOpeningBalance,
  reverseLedgerEntry,
} from "@/lib/modules/ledger/corrections";
import {
  AllocationValidationError,
  recordTransaction,
} from "@/lib/modules/ledger/service";
import {
  openingBalanceBodySchema,
  recordTransactionBodySchema,
  reverseLedgerEntryBodySchema,
  type OpeningBalanceBodyValues,
  type RecordTransactionBodyValues,
  type ReverseLedgerEntryBodyValues,
} from "@/lib/modules/ledger/schemas";
import { actionError, actionOk, type ActionResult } from "./form-result";

const customerIdParam = z.string().uuid("Client invalide.");

function revalidateLedgerPaths(customerId?: string) {
  revalidatePath("/transactions");
  revalidatePath("/clients");
  if (customerId) {
    revalidatePath(`/clients/${customerId}`);
  }
}

export async function recordTransactionAction(
  customerId: string,
  input: RecordTransactionBodyValues,
): Promise<ActionResult<{ id: string }>> {
  const auth = await requireRole([...LEDGER_MUTATION_ROLES]);

  const idParsed = customerIdParam.safeParse(customerId);
  if (!idParsed.success) {
    return actionError("Client invalide.");
  }

  const bodyParsed = recordTransactionBodySchema.safeParse(input);
  if (!bodyParsed.success) {
    const first = bodyParsed.error.issues[0];
    return actionError(first?.message ?? "Données invalides");
  }

  try {
    const entry = await recordTransaction(getDb(), toModuleContext(auth), {
      customerId: idParsed.data,
      ...bodyParsed.data,
    });
    revalidateLedgerPaths(idParsed.data);
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

/** @deprecated Use recordTransactionAction */
export const recordVersementAction = recordTransactionAction;

/** @deprecated Use recordTransactionAction */
export const recordChargeAction = recordTransactionAction;

export async function recordOpeningBalanceAction(
  customerId: string,
  input: OpeningBalanceBodyValues,
): Promise<ActionResult<{ id: string }>> {
  const auth = await requireRole([...LEDGER_MUTATION_ROLES]);

  const idParsed = customerIdParam.safeParse(customerId);
  if (!idParsed.success) {
    return actionError("Client invalide.");
  }

  const bodyParsed = openingBalanceBodySchema.safeParse(input);
  if (!bodyParsed.success) {
    const first = bodyParsed.error.issues[0];
    return actionError(first?.message ?? "Données invalides");
  }

  try {
    const entry = await recordOpeningBalance(getDb(), toModuleContext(auth), {
      customerId: idParsed.data,
      ...bodyParsed.data,
    });
    revalidateLedgerPaths(idParsed.data);
    return actionOk({ id: entry.id });
  } catch (err) {
    if (err instanceof LedgerCorrectionError) {
      return actionError(err.message);
    }
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return actionError(message);
  }
}

export async function reverseLedgerEntryAction(
  entryId: string,
  input: ReverseLedgerEntryBodyValues,
): Promise<ActionResult<{ id: string }>> {
  const auth = await requireRole([...LEDGER_MUTATION_ROLES]);

  const entryParsed = z.string().uuid("Écriture invalide.").safeParse(entryId);
  if (!entryParsed.success) {
    return actionError("Écriture invalide.");
  }

  const bodyParsed = reverseLedgerEntryBodySchema.safeParse(input);
  if (!bodyParsed.success) {
    const first = bodyParsed.error.issues[0];
    return actionError(first?.message ?? "Données invalides");
  }

  try {
    const entry = await reverseLedgerEntry(
      getDb(),
      toModuleContext(auth),
      {
        entryId: entryParsed.data,
        ...bodyParsed.data,
      },
    );
    revalidateLedgerPaths(entry.customerId);
    revalidatePath("/transactions");
    return actionOk({ id: entry.id });
  } catch (err) {
    if (err instanceof LedgerCorrectionError) {
      return actionError(err.message);
    }
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return actionError(message);
  }
}
