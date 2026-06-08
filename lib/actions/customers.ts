"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { toModuleContext } from "@/lib/auth/module-context";
import { LEDGER_MUTATION_ROLES } from "@/lib/auth/permissions";
import { requireRole } from "@/lib/auth/session";
import {
  createCustomerSchema,
  updateCustomerSchema,
  type CreateCustomerFormInput,
  type UpdateCustomerInput,
} from "@/lib/modules/customers/schemas";
import {
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerById,
} from "@/lib/modules/customers/service";
import type { CustomerAccountStatus } from "@/lib/db/enums";
import { actionError, actionOk, type ActionResult } from "./form-result";

export async function getCustomerAction(customerId: string) {
  const auth = await requireRole(["owner", "admin", "operator"]);
  return getCustomerById(getDb(), toModuleContext(auth), customerId);
}

export async function createCustomerAction(
  input: CreateCustomerFormInput,
): Promise<ActionResult<{ id: string }>> {
  const auth = await requireRole(["owner", "admin", "operator"]);
  const parsed = createCustomerSchema.safeParse(input);

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return actionError(first?.message ?? "Données invalides");
  }

  try {
    const customer = await createCustomer(
      getDb(),
      toModuleContext(auth),
      parsed.data,
    );
    revalidatePath("/clients");
    return { ok: true, data: { id: customer.id } };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return actionError(message);
  }
}

export async function updateCustomerInfoAction(
  customerId: string,
  input: UpdateCustomerInput,
): Promise<ActionResult<void>> {
  const auth = await requireRole(["owner", "admin", "operator"]);
  const parsed = updateCustomerSchema.safeParse(input);

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return actionError(first?.message ?? "Données invalides");
  }

  const updated = await updateCustomer(
    getDb(),
    toModuleContext(auth),
    customerId,
    parsed.data,
  );

  if (!updated) {
    return actionError("Client introuvable.");
  }

  revalidatePath("/clients");
  revalidatePath(`/clients/${customerId}`);
  return actionOk();
}

export async function deleteCustomerAction(
  customerId: string,
): Promise<ActionResult<void>> {
  const auth = await requireRole(["owner", "admin"]);

  const deleted = await deleteCustomer(getDb(), toModuleContext(auth), customerId);

  if (!deleted) {
    return actionError("Client introuvable.");
  }

  revalidatePath("/clients");
  return actionOk();
}

export async function updateCustomerAccountStatusAction(
  customerId: string,
  accountStatus: CustomerAccountStatus,
): Promise<ActionResult<void>> {
  const auth = await requireRole([...LEDGER_MUTATION_ROLES]);
  const updated = await updateCustomer(
    getDb(),
    toModuleContext(auth),
    customerId,
    { accountStatus },
  );

  if (!updated) {
    return actionError("Client introuvable.");
  }

  revalidatePath("/clients");
  revalidatePath(`/clients/${customerId}`);
  return actionOk();
}
