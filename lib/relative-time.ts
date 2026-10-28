const UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ['day', 86_400_000],
  ['hour', 3_600_000],
  ['minute', 60_000],
];

/**
 * "2 hours ago", "yesterday". Computed by the caller with an explicit `now`,
 * on the server, so components can render it without reading the clock.
 */
export function relativeTime(date: Date, now: Date = new Date(), locale = 'en-GB'): string {
  const elapsed = date.getTime() - now.getTime();
  const format = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  for (const [unit, ms] of UNITS) {
    if (Math.abs(elapsed) >= ms) return format.format(Math.round(elapsed / ms), unit);
  }
  return 'just now';
}
