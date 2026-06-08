import { agencyDateRangeForPreset } from "@/lib/modules/ledger/transactions-query";

export type CarteDatePreset =
  | "today"
  | "yesterday"
  | "week"
  | "month"
  | "last30"
  | "all";

export type CarteLedgerViewState = {
  payingAgencyId: string;
  datePreset: CarteDatePreset;
  dateFrom: string;
  dateTo: string;
};

const DATE_PRESETS: CarteDatePreset[] = [
  "today",
  "yesterday",
  "week",
  "month",
  "last30",
  "all",
];

export function parseCarteLedgerViewState(
  params: Record<string, string | string[] | undefined>,
  today: string,
  defaultAgencyId: string,
): CarteLedgerViewState {
  const single = (key: string): string | undefined => {
    const v = params[key];
    if (Array.isArray(v)) return v[0];
    return v;
  };

  const payingAgencyId = single("carte") ?? defaultAgencyId;

  const periodRaw = single("period") ?? "month";
  const datePreset = DATE_PRESETS.includes(periodRaw as CarteDatePreset)
    ? (periodRaw as CarteDatePreset)
    : "month";

  const explicitFrom = single("from");
  const explicitTo = single("to");

  let dateFrom = explicitFrom ?? "";
  let dateTo = explicitTo ?? "";

  if (!explicitFrom && !explicitTo && datePreset !== "all") {
    const range = agencyDateRangeForPreset(datePreset, today);
    dateFrom = range.dateFrom;
    dateTo = range.dateTo;
  }

  return {
    payingAgencyId,
    datePreset: explicitFrom || explicitTo ? "all" : datePreset,
    dateFrom,
    dateTo,
  };
}

export function serializeCarteLedgerSearchParams(
  state: CarteLedgerViewState,
): URLSearchParams {
  const sp = new URLSearchParams();
  sp.set("carte", state.payingAgencyId);
  if (state.datePreset !== "month") sp.set("period", state.datePreset);
  if (state.dateFrom) sp.set("from", state.dateFrom);
  if (state.dateTo) sp.set("to", state.dateTo);
  return sp;
}
