"use server";

import { z } from "zod";
import { getDb } from "@/lib/db";
import { toModuleContext } from "@/lib/auth/module-context";
import { requireAuthContext } from "@/lib/auth/session";
import {
  getCustomerFormSuggestions,
  getOrgFormSuggestions,
  type FormSuggestions,
} from "@/lib/modules/form-suggestions/service";
import { actionError, actionOk, type ActionResult } from "./form-result";

const customerIdParam = z.string().uuid();

export async function getOrgFormSuggestionsAction(): Promise<
  ActionResult<FormSuggestions>
> {
  const auth = await requireAuthContext();
  const db = getDb();
  const ctx = toModuleContext(auth);
  const data = await getOrgFormSuggestions(db, ctx);
  return actionOk(data);
}

export async function getCustomerFormSuggestionsAction(
  customerId: string,
): Promise<ActionResult<Pick<FormSuggestions, "ledgerLabels">>> {
  const auth = await requireAuthContext();
  const parsed = customerIdParam.safeParse(customerId);
  if (!parsed.success) {
    return actionError("Client invalide.");
  }
  const db = getDb();
  const ctx = toModuleContext(auth);
  const data = await getCustomerFormSuggestions(db, ctx, parsed.data);
  return actionOk(data);
}
