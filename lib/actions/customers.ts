"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { toModuleContext } from "@/lib/auth/module-context";
import { requireAuthContext } from "@/lib/auth/session";
import {
  createCustomerSchema,
  type CreateCustomerInput,
} from "@/lib/modules/customers/schemas";
import { createCustomer } from "@/lib/modules/customers/service";
import { actionError, type ActionResult } from "./form-result";

export async function createCustomerAction(
  input: CreateCustomerInput,
): Promise<ActionResult<{ id: string }>> {
  const auth = await requireAuthContext();
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
