import type { DeclarationEditLogEntry } from "./service";

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
    customsReference: string;
    bureau: string;
    bonADelivrer: boolean;
  };
  editLog: DeclarationEditLogEntry[];
};
