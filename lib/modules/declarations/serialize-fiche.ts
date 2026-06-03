/** Client-safe activity row (dates as ISO strings after server action JSON). */
export type ActivityLogEntrySerialized = {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  payload: Record<string, unknown> | null;
  actorId: string | null;
  createdAt: string;
};

/** Client-safe edit log row (dates as ISO strings after server action JSON). */
export type DeclarationEditLogEntrySerialized = {
  id: string;
  changes: Record<string, { from: string | null; to: string | null }>;
  changedBy: string | null;
  changedAt: string;
};

export type DeclarationFicheSerialized = {
  declarationId: string;
  formKey: string;
  declarationNumber: string;
  bonADelivrer: boolean;
  dossier: {
    id: string;
    dossierNumber: string;
    blReference: string | null;
  };
  customer: { id: string; name: string; slug: string };
  payingAgencyName: string | null;
  amounts: {
    clientAmountPaid: string | null;
    gaindeDutyAmount: string | null;
    costPrice: string | null;
  };
  editInitial: {
    declarationId: string;
    blReference: string;
    zoneOrTerminal: string;
    declarationDate: string;
    containerCount: number;
    containers: string[];
    clientAmountPaid: string;
    gaindeDutyAmount: string;
    costPrice: string;
    payingAgencyId: string;
    bonADelivrer: boolean;
  };
  editLog: DeclarationEditLogEntrySerialized[];
  activityLog: ActivityLogEntrySerialized[];
};
