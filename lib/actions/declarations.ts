"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { toModuleContext } from "@/lib/auth/module-context";
import { requireRole } from "@/lib/auth/session";
import { OrgScopeError } from "@/lib/modules/shared/org-refs";
import {
  createDeclarationSchema,
  updateDeclarationSchema,
  type CreateDeclarationFormValues,
  type UpdateDeclarationFormValues,
} from "@/lib/modules/declarations/schemas";
import {
  BonADelivrerIncompleteError,
  createDeclaration,
  DuplicateBlError,
  setBonADelivrer,
  updateDeclaration,
} from "@/lib/modules/declarations/service";
import { formatBonADelivrerError } from "@/lib/domain/format-validation";
import { actionError, actionOk, type ActionResult } from "./form-result";

const MUTATION_ROLES = ["owner", "admin", "operator"] as const;

function revalidateDeclaration(declarationId: string) {
  revalidatePath("/declarations");
  revalidatePath(`/declarations/${declarationId}`);
  revalidatePath(`/declarations?open=${declarationId}`);
}

export async function createDeclarationAction(
  input: CreateDeclarationFormValues,
): Promise<ActionResult<{ id: string }>> {
  const auth = await requireRole([...MUTATION_ROLES]);
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
    revalidatePath(`/declarations/${declaration.id}`);
    return actionOk({ id: declaration.id });
  } catch (err) {
    if (err instanceof DuplicateBlError) return actionError(err.message);
    if (err instanceof BonADelivrerIncompleteError) {
      return actionError(formatBonADelivrerError(err.missing));
    }
    if (err instanceof OrgScopeError) return actionError(err.message);
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return actionError(message);
  }
}

export type UpdateDeclarationActionInput = UpdateDeclarationFormValues & {
  declarationId: string;
};

export async function updateDeclarationAction(
  input: UpdateDeclarationActionInput,
): Promise<ActionResult<{ id: string }>> {
  const auth = await requireRole([...MUTATION_ROLES]);
  const { declarationId, ...rest } = input;
  const parsed = updateDeclarationSchema.safeParse(rest);

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return actionError(first?.message ?? "Données invalides");
  }

  try {
    const updated = await updateDeclaration(
      getDb(),
      toModuleContext(auth),
      declarationId,
      parsed.data,
    );
    if (!updated) {
      return actionError("Déclaration introuvable.");
    }
    revalidateDeclaration(declarationId);
    return actionOk({ id: declarationId });
  } catch (err) {
    if (err instanceof DuplicateBlError) return actionError(err.message);
    if (err instanceof BonADelivrerIncompleteError) {
      return actionError(formatBonADelivrerError(err.missing));
    }
    if (err instanceof OrgScopeError) return actionError(err.message);
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return actionError(message);
  }
}

export async function setBonADelivrerAction(
  declarationId: string,
  value: boolean,
): Promise<ActionResult<{ id: string }>> {
  const auth = await requireRole([...MUTATION_ROLES]);

  try {
    const updated = await setBonADelivrer(
      getDb(),
      toModuleContext(auth),
      declarationId,
      value,
    );
    if (!updated) {
      return actionError("Déclaration introuvable.");
    }
    revalidateDeclaration(declarationId);
    return actionOk({ id: declarationId });
  } catch (err) {
    if (err instanceof BonADelivrerIncompleteError) {
      return actionError(formatBonADelivrerError(err.missing));
    }
    if (err instanceof OrgScopeError) return actionError(err.message);
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return actionError(message);
  }
}
