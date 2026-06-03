/** Reste (marge) = montant client − prix de revient. */

export function computeDeclarationReste(
  clientAmountPaid: bigint | null | undefined,
  costPrice: bigint | null | undefined,
): bigint | null {
  if (clientAmountPaid == null || costPrice == null) return null;
  return clientAmountPaid - costPrice;
}
