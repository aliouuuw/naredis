import { formatXof } from "@/lib/domain/balance";
import type { EditDeclarationInitial } from "./edit-declaration-form";

function formatMoney(value: string) {
  if (!value) return "—";
  try {
    return `${formatXof(BigInt(value))} XOF`;
  } catch {
    return value;
  }
}

export function DeclarationReadOnlySummary({
  initial,
  payingAgencyName,
}: {
  initial: EditDeclarationInitial;
  payingAgencyName: string | null;
}) {
  return (
    <dl className="grid gap-4 text-sm sm:grid-cols-2">
      <div>
        <dt className="text-muted-foreground">BL</dt>
        <dd className="font-mono">{initial.blReference || "—"}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Date</dt>
        <dd>{initial.declarationDate || "—"}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Zone / terminal</dt>
        <dd>{initial.zoneOrTerminal || "—"}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Nombre de conteneurs</dt>
        <dd className="tabular-nums">
          {initial.containerCount > 0 ? initial.containerCount : "—"}
        </dd>
      </div>
      <div className="sm:col-span-2">
        <dt className="text-muted-foreground">Numéros de conteneurs</dt>
        <dd className="mt-1">
          {initial.containers.length > 0 ? (
            <ul className="flex flex-wrap gap-1.5">
              {initial.containers.map((c) => (
                <li
                  key={c}
                  className="rounded-md border bg-muted/50 px-2 py-0.5 font-mono text-xs tracking-wide"
                >
                  {c}
                </li>
              ))}
            </ul>
          ) : (
            <span className="text-muted-foreground">Aucun numéro renseigné</span>
          )}
        </dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Montant client</dt>
        <dd className="tabular-nums">{formatMoney(initial.clientAmountPaid)}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">GAINDE</dt>
        <dd className="tabular-nums">{formatMoney(initial.gaindeDutyAmount)}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Prix de revient</dt>
        <dd className="tabular-nums">{formatMoney(initial.costPrice)}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Maison-mère</dt>
        <dd>{payingAgencyName ?? "—"}</dd>
      </div>
    </dl>
  );
}
