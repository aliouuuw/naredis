"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { toModuleContext } from "@/lib/auth/module-context";
import { requireRole } from "@/lib/auth/session";
import {
  createDeclarationSchema,
  type CreateDeclarationFormValues,
} from "@/lib/modules/declarations/schemas";
import {
  BonADelivrerIncompleteError,
  createDeclaration,
  DuplicateBlError,
} from "@/lib/modules/declarations/service";
import { actionError, type ActionResult } from "./form-result";

export async function createDeclarationAction(
  input: CreateDeclarationFormValues,
): Promise<ActionResult<{ id: string }>> {
  const auth = await requireRole(["owner", "admin", "operator"]);
  const parsed = createDeclarationSchema.safeParse(input);

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return actionError(first?.message ?? "Données invalides");
  }

  try {
    const { declaration } = await createDeclaration(
      getDb(),
      toModuleContext(auth),
      parsed.data,
    );
    revalidatePath("/declarations");
    return { ok: true, data: { id: declaration.id } };
  } catch (err) {
    if (err instanceof DuplicateBlError) return actionError(err.message);
    if (err instanceof BonADelivrerIncompleteError) {
      return actionError(err.message);
    }
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return actionError(message);
  }
}
