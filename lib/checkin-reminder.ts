/**
 * When to remind someone to check in. Pure: the query and the send are in
 * lib/checkin-reminder.server.ts, and the toggle imports from here.
 *
 * Vercel Hobby runs a cron once a day at one fixed UTC time (vercel.json:
 * 19:00, delivered some time within that hour), so the reminder reaches each
 * person at a different local hour: evening in the UK and Europe, afternoon in
 * the Americas. Two things are kept local regardless. "Today" is the person's
 * own day, from the zone their browser reported when they turned it on. And
 * nobody is reminded overnight: outside the hours below, nothing goes.
 */

/** Earliest local hour a reminder may arrive. */
export const REMINDER_FROM_HOUR = 8
/** Local hour from which it is too late; a reminder at 23:00 is a wake-up. */
export const REMINDER_UNTIL_HOUR = 22

export function isValidTimeZone(timeZone: string): boolean {
  if (!timeZone) return false
  try {
    new Intl.DateTimeFormat("en-US", { timeZone })
    return true
  } catch {
    return false
  }
}

/** The calendar date (YYYY-MM-DD) and hour (0–23) at `now` in `timeZone`. */
export function localDay(now: Date, timeZone: string): { date: string; hour: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now)
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? ""
  return {
    date: `${part("year")}-${part("month")}-${part("day")}`,
    hour: Number(part("hour")),
  }
}

export function isReminderDue({
  now,
  timeZone,
  lastLogDate,
  remindedOn,
}: {
  now: Date
  timeZone: string
  /** Their most recent check-in's day, as stored in smoke_logs.log_date. */
  lastLogDate: string | null
  /** Their local date when they were last reminded. */
  remindedOn: string | null
}): boolean {
  if (!isValidTimeZone(timeZone)) return false
  const { date, hour } = localDay(now, timeZone)
  if (hour < REMINDER_FROM_HOUR || hour >= REMINDER_UNTIL_HOUR) return false
  if (remindedOn === date) return false
  // ISO dates compare correctly as strings.
  return lastLogDate === null || lastLogDate < date
}
