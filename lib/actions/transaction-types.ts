"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { toModuleContext } from "@/lib/auth/module-context";
import { LEDGER_MUTATION_ROLES } from "@/lib/auth/permissions";
import { requireRole } from "@/lib/auth/session";
import {
  createTransactionType,
  listTransactionTypes,
  updateTransactionType,
  type TransactionTypeRow,
} from "@/lib/modules/ledger/transaction-types";
import {
  createTransactionTypeSchema,
  updateTransactionTypeSchema,
  type CreateTransactionTypeInput,
  type UpdateTransactionTypeInput,
} from "@/lib/modules/ledger/schemas";
import { listDossiersForCustomer } from "@/lib/modules/ledger/service";
import { actionError, actionOk, type ActionResult } from "./form-result";

export type TransactionTypeSerialized = TransactionTypeRow;

function revalidateTypes() {
  revalidatePath("/transactions");
  revalidatePath("/clients");
}

export async function listTransactionTypesAction(): Promise<
  ActionResult<TransactionTypeSerialized[]>
> {
  const auth = await requireRole([...LEDGER_MUTATION_ROLES]);
  const rows = await listTransactionTypes(getDb(), toModuleContext(auth));
  return actionOk(rows);
}

export async function createTransactionTypeAction(
  input: CreateTransactionTypeInput,
): Promise<ActionResult<TransactionTypeSerialized>> {
  const auth = await requireRole([...LEDGER_MUTATION_ROLES]);
  const parsed = createTransactionTypeSchema.safeParse(input);

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return actionError(first?.message ?? "Données invalides");
  }

  try {
    const row = await createTransactionType(
      getDb(),
      toModuleContext(auth),
      parsed.data,
    );
    revalidateTypes();
    return actionOk(row);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return actionError(message);
  }
}

export async function updateTransactionTypeAction(
  input: UpdateTransactionTypeInput,
): Promise<ActionResult<TransactionTypeSerialized>> {
  const auth = await requireRole([...LEDGER_MUTATION_ROLES]);
  const parsed = updateTransactionTypeSchema.safeParse(input);

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return actionError(first?.message ?? "Données invalides");
  }

  try {
    const row = await updateTransactionType(
      getDb(),
      toModuleContext(auth),
      parsed.data.transactionTypeId,
      { name: parsed.data.name },
    );
    revalidateTypes();
    return actionOk(row);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return actionError(message);
  }
}

export async function listDossiersForCustomerAction(
  customerId: string,
): Promise<
  ActionResult<
    Array<{
      id: string;
      dossierNumber: string;
      blReference: string | null;
    }>
  >
> {
  const auth = await requireRole([...LEDGER_MUTATION_ROLES]);
  const rows = await listDossiersForCustomer(
    getDb(),
    toModuleContext(auth),
    customerId,
  );
  return actionOk(
    rows.map((d) => ({
      id: d.id,
      dossierNumber: d.dossierNumber,
      blReference: d.blReference,
    })),
  );
}
