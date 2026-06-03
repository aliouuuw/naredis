/** MVP default agency calendar (GMT, no DST). Override per org later. */
export const AGENCY_TIMEZONE = "Africa/Dakar";

/** `YYYY-MM-DD` in agency local calendar. */
export function agencyCalendarDate(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: AGENCY_TIMEZONE,
  }).format(date);
}

export function agencyCalendarYear(date: Date = new Date()): number {
  return Number(agencyCalendarDate(date).slice(0, 4));
}
