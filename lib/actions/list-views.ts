"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { MUTATION_ROLES } from "@/lib/auth/permissions";
import { toModuleContext } from "@/lib/auth/module-context";
import { requireRole } from "@/lib/auth/session";
import {
  createListViewSchema,
  deleteListViewSchema,
  type ListViewPageKey,
} from "@/lib/modules/list-views/schemas";
import {
  createOrganizationListView,
  deleteOrganizationListView,
  type OrganizationListViewRow,
} from "@/lib/modules/list-views/service";
import { actionError, actionOk, type ActionResult } from "./form-result";

function revalidateListViewPage(pageKey: ListViewPageKey) {
  if (pageKey === "declarations") revalidatePath("/declarations");
  if (pageKey === "clients") revalidatePath("/clients");
  if (pageKey === "transactions") revalidatePath("/transactions");
}

export async function createOrgListViewAction(input: {
  pageKey: ListViewPageKey;
  name: string;
  query: string;
}): Promise<ActionResult<OrganizationListViewRow>> {
  const auth = await requireRole([...MUTATION_ROLES]);
  const parsed = createListViewSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return actionError(first?.message ?? "Données invalides");
  }

  try {
    const row = await createOrganizationListView(
      getDb(),
      toModuleContext(auth),
      parsed.data,
    );
    revalidateListViewPage(parsed.data.pageKey);
    return actionOk(row);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    if (message.includes("unique") || message.includes("duplicate")) {
      return actionError("Une vue avec ce nom existe déjà pour cette page.");
    }
    return actionError(message);
  }
}

export async function deleteOrgListViewAction(input: {
  viewId: string;
  pageKey: ListViewPageKey;
}): Promise<ActionResult> {
  const auth = await requireRole([...MUTATION_ROLES]);
  const parsed = deleteListViewSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return actionError(first?.message ?? "Données invalides");
  }

  const removed = await deleteOrganizationListView(
    getDb(),
    toModuleContext(auth),
    parsed.data.viewId,
    parsed.data.pageKey,
  );

  if (!removed) {
    return actionError("Vue introuvable.");
  }

  revalidateListViewPage(parsed.data.pageKey);
  return actionOk();
}
