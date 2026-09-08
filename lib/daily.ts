/**
 * Picks one item from a list, rotating once per day.
 *
 * Deliberately UTC-based. This runs on the server and the result is passed to
 * the client as a prop, so both sides must agree on which day it is; using the
 * local calendar would make the boundary depend on whose clock is asked. The
 * cost is that the rotation happens at UTC midnight rather than the viewer's.
 */
export function pickForToday<T>(items: readonly T[], now: Date = new Date()): T {
  if (items.length === 0) {
    throw new Error("pickForToday requires a non-empty list")
  }

  const startOfYear = Date.UTC(now.getUTCFullYear(), 0, 0)
  const dayOfYear = Math.floor((now.getTime() - startOfYear) / 86_400_000)

  return items[dayOfYear % items.length]
}
