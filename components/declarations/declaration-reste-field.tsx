"use client";

import { useMemo } from "react";
import { computeDeclarationReste } from "@/lib/domain/declaration-reste";
import { formatXof } from "@/lib/domain/balance";

function parseMoneyInput(value: string): bigint | null {
  const trimmed = value.replace(/\s/g, "");
  if (!trimmed) return null;
  try {
    return BigInt(trimmed);
  } catch {
    return null;
  }
}

export function DeclarationResteField({
  clientAmountPaid,
  costPrice,
}: {
  clientAmountPaid: string;
  costPrice: string;
}) {
  const reste = useMemo(() => {
    return computeDeclarationReste(
      parseMoneyInput(clientAmountPaid),
      parseMoneyInput(costPrice),
    );
  }, [clientAmountPaid, costPrice]);

  return (
    <div className="flex flex-col gap-2 sm:col-span-2">
      <span className="text-sm font-medium">Reste (marge)</span>
      <p className="rounded-lg border bg-muted/30 px-3 py-2 text-sm tabular-nums">
        {reste != null ? (
          <>
            {formatXof(reste)} XOF
            <span className="ml-2 text-xs text-muted-foreground">
              (montant client − prix de revient)
            </span>
          </>
        ) : (
          <span className="text-muted-foreground">
            Renseignez le montant client et le prix de revient.
          </span>
        )}
      </p>
    </div>
  );
}
