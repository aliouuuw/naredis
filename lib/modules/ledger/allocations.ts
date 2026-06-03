export type AllocationLine = { dossierId: string; amount: bigint };

export class AllocationValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AllocationValidationError";
  }
}

export function sumAllocations(allocations: AllocationLine[]): bigint {
  return allocations.reduce((sum, line) => sum + line.amount, BigInt(0));
}

/** Ensures allocation lines are valid before persisting a versement. */
export function validateVersementAllocations(
  entryAmount: bigint,
  allocations: AllocationLine[],
): void {
  const seen = new Set<string>();

  for (const line of allocations) {
    if (seen.has(line.dossierId)) {
      throw new AllocationValidationError(
        "Chaque dossier ne peut apparaître qu'une seule fois dans les affectations.",
      );
    }
    seen.add(line.dossierId);
  }

  const total = sumAllocations(allocations);
  if (total > entryAmount) {
    throw new AllocationValidationError(
      "La somme des affectations dépasse le montant du versement.",
    );
  }
}
