const MINUTE = 1
const HOUR = 60
const DAY = 24 * HOUR

/**
 * Minutes smoke-free at which each milestone is reached.
 *
 * Lives here rather than in the component that displays it so the buddy summary
 * can count reached milestones without importing UI — a server module importing
 * a React component to read a lookup table is how that kind of dependency
 * usually starts.
 */
export const MILESTONE_THRESHOLDS: Record<string, number> = {
  "20_minutes": 20 * MINUTE,
  "12_hours": 12 * HOUR,
  "24_hours": 1 * DAY,
  "48_hours": 2 * DAY,
  "72_hours": 3 * DAY,
  "1_week": 7 * DAY,
  "2_weeks": 14 * DAY,
  "1_month": 30 * DAY,
  "3_months": 90 * DAY,
  "6_months": 180 * DAY,
  "1_year": 365 * DAY,
  "5_years": 5 * 365 * DAY,
  "10_years": 10 * 365 * DAY,
}

/** How many milestones a streak of `minutes` has passed. */
export function milestonesReached(minutes: number): number {
  return Object.values(MILESTONE_THRESHOLDS).filter((t) => minutes >= t).length
}

export const MILESTONE_COUNT = Object.keys(MILESTONE_THRESHOLDS).length
