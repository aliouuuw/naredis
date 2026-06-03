const ACTION_LABELS: Record<string, string> = {
  "declaration.created": "Déclaration créée",
  "declaration.updated": "Fiche déclaration modifiée",
  "customer.created": "Client créé",
  "customer.updated": "Client mis à jour",
  "ledger.transaction_recorded": "Écriture comptable",
  "ledger.versement_recorded": "Versement enregistré",
  "ledger.opening_balance_recorded": "Solde d'ouverture",
  "ledger.entry_reversed": "Contre-passation",
  "dossier.created": "Dossier créé",
  "dossier.updated": "Dossier mis à jour",
};

const ENTITY_SCOPE_LABELS: Record<string, string> = {
  declaration: "Cette déclaration",
  dossier: "Dossier lié",
  ledger_entry: "Compte client",
  customer: "Client",
};

export function activityActionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action.replaceAll(".", " · ");
}

export function activityEntityScopeLabel(entityType: string): string {
  return ENTITY_SCOPE_LABELS[entityType] ?? entityType;
}

export function formatActivityDetail(
  action: string,
  payload: Record<string, unknown> | null | undefined,
): string | null {
  if (!payload) return null;

  if (action === "declaration.created") {
    const parts: string[] = [];
    if (typeof payload.declarationNumber === "string") {
      parts.push(payload.declarationNumber);
    }
    if (typeof payload.blReference === "string") {
      parts.push(`BL ${payload.blReference}`);
    }
    return parts.length > 0 ? parts.join(" · ") : null;
  }

  if (action === "declaration.updated") {
    const changes = payload.changes;
    if (Array.isArray(changes) && changes.length > 0) {
      return `Champs : ${changes.join(", ")}`;
    }
    return null;
  }

  if (
    action === "ledger.transaction_recorded" ||
    action === "ledger.versement_recorded"
  ) {
    const parts: string[] = [];
    if (typeof payload.transactionType === "string") {
      parts.push(payload.transactionType);
    }
    if (payload.amount != null && payload.balanceSide != null) {
      parts.push(
        `${String(payload.amount)} XOF (${String(payload.balanceSide)})`,
      );
    } else if (payload.amount != null) {
      parts.push(`${String(payload.amount)} XOF`);
    }
    return parts.length > 0 ? parts.join(" · ") : null;
  }

  if (action === "ledger.entry_reversed" && payload.reversesEntryId) {
    return "Annulation d'une écriture précédente";
  }

  if (action === "customer.created" && typeof payload.name === "string") {
    return payload.name;
  }

  if (action === "dossier.updated" && typeof payload.caseStatus === "string") {
    const labels: Record<string, string> = {
      open: "rouvert",
      on_hold: "mis en attente",
      closed: "clôturé",
    };
    return `Statut : ${labels[payload.caseStatus] ?? payload.caseStatus}`;
  }

  return null;
}

export function activityItemHref(
  entityType: string,
  entityId: string,
): string | null {
  switch (entityType) {
    case "declaration":
      return `/declarations?open=${entityId}`;
    case "dossier":
      return `/dossiers/${entityId}`;
    case "customer":
      return `/clients/${entityId}`;
    case "ledger_entry":
      return "/transactions";
    default:
      return null;
  }
}
