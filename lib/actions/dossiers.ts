"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { toModuleContext } from "@/lib/auth/module-context";
import { MUTATION_ROLES } from "@/lib/auth/permissions";
import { requireRole } from "@/lib/auth/session";
import { appendActivity } from "@/lib/modules/activity/append-activity";
import { getDossierHub } from "@/lib/modules/dossiers/hub";
import { updateDossierCaseStatus } from "@/lib/modules/dossiers/service";
import { actionError, actionOk, type ActionResult } from "./form-result";

const dossierIdParam = z.string().uuid("Dossier invalide.");

export async function closeDossierCaseAction(
  dossierId: string,
): Promise<ActionResult> {
  const auth = await requireRole([...MUTATION_ROLES]);
  const parsed = dossierIdParam.safeParse(dossierId);
  if (!parsed.success) {
    return actionError("Dossier invalide.");
  }

  const db = getDb();
  const ctx = toModuleContext(auth);

  const hub = await getDossierHub(db, ctx, parsed.data);
  if (!hub) {
    return actionError("Dossier introuvable.");
  }
  if (hub.dossier.caseStatus === "closed") {
    return actionError("Ce dossier est déjà clôturé.");
  }

  await db.transaction(async (tx) => {
    const updated = await updateDossierCaseStatus(
      tx,
      ctx,
      parsed.data,
      "closed",
    );
    if (!updated) {
      throw new Error("Dossier introuvable.");
    }
    await appendActivity(tx, {
      organizationId: ctx.organizationId,
      entityType: "dossier",
      entityId: parsed.data,
      action: "dossier.updated",
      payload: { caseStatus: "closed" },
      actorId: auth.userId,
    });
  });

  revalidatePath(`/dossiers/${parsed.data}`);
  revalidatePath("/dashboard");
  revalidatePath("/dossiers", "layout");

  return actionOk();
}
