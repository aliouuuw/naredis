/** Fields required before `bon_a_delivrer` can be set to true. */
export const BON_A_DELIVRER_REQUIRED = [
  "zoneOrTerminal",
  "declarationDate",
  "blReference",
  "containerCount",
  "containers",
  "clientAmountPaid",
  "gaindeDutyAmount",
  "costPrice",
] as const;

export type DeclarationCompletionInput = {
  zoneOrTerminal: string | null | undefined;
  declarationDate: string | null | undefined;
  blReference: string | null | undefined;
  containerCount: number | null | undefined;
  containers: string[];
  clientAmountPaid: bigint | null | undefined;
  gaindeDutyAmount: bigint | null | undefined;
  costPrice: bigint | null | undefined;
};

export function getBonADelivrerMissingFields(
  input: DeclarationCompletionInput,
): string[] {
  const missing: string[] = [];

  if (!input.zoneOrTerminal?.trim()) missing.push("zoneOrTerminal");
  if (!input.declarationDate) missing.push("declarationDate");
  if (!input.blReference?.trim()) missing.push("blReference");

  const count = input.containerCount ?? 0;
  if (count < 1) missing.push("containerCount");

  const containers = input.containers.filter((c) => c.trim().length > 0);
  if (containers.length < count) missing.push("containers");

  if (input.clientAmountPaid == null) missing.push("clientAmountPaid");
  if (input.gaindeDutyAmount == null) missing.push("gaindeDutyAmount");
  if (input.costPrice == null) missing.push("costPrice");

  return missing;
}

export function canSetBonADelivrer(input: DeclarationCompletionInput): boolean {
  return getBonADelivrerMissingFields(input).length === 0;
}

/** Keys stored in declaration_edit_log JSON. */
export const TRACKED_DECLARATION_FIELDS = [
  "zone_or_terminal",
  "declaration_date",
  "container_count",
  "client_amount_paid",
  "gainde_duty_amount",
  "cost_price",
  "paying_agency_id",
  "bl_reference",
  "customs_reference",
  "bureau",
  "bon_a_delivrer",
] as const;
