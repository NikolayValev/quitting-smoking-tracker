import { copingStrategies } from "@/lib/data/wellness-tips"

/**
 * Cravings: the fixed vocabulary they are recorded in, and the patterns drawn
 * from them. Pure, so the record form (a client component) and the journey
 * page can both import it. The query is in lib/cravings.server.ts.
 */

/** The moments in copingStrategies, plus one for everything else. */
export const CRAVING_TRIGGERS = [
  "morning",
  "coffee",
  "after-meal",
  "driving",
  "drink",
  "break",
  "stress",
  "other",
] as const
export type CravingTrigger = (typeof CRAVING_TRIGGERS)[number]

export const CRAVING_OUTCOMES = ["passed", "smoked"] as const
export type CravingOutcome = (typeof CRAVING_OUTCOMES)[number]

export const CRAVING_STRENGTHS = [1, 2, 3, 4, 5] as const

export function triggerLabel(trigger: CravingTrigger): string {
  return copingStrategies.find((s) => s.id === trigger)?.title ?? "Something else"
}

export type TimeOfDay = "morning" | "afternoon" | "evening" | "night"

/** Buckets wide enough to be a pattern rather than noise, at a few a week. */
export function timeOfDay(hour: number): TimeOfDay {
  if (hour >= 5 && hour < 12) return "morning"
  if (hour >= 12 && hour < 17) return "afternoon"
  if (hour >= 17 && hour < 22) return "evening"
  return "night"
}

export type CravingRecord = {
  createdAt: Date
  trigger: CravingTrigger
  strength: number
  outcome: CravingOutcome
  localHour: number
}

export type CravingSummary = {
  days: number
  total: number
  passed: number
  /** Mean strength, to one decimal place. */
  averageStrength: number
  /** Most frequent first; ties keep the order of CRAVING_TRIGGERS. */
  triggers: Array<{ trigger: CravingTrigger; count: number; passed: number }>
  /**
   * The time of day with the most cravings, or null when no one period stands
   * out. A tie is not a pattern, and saying "evenings" on the strength of one
   * craving more than mornings would be inventing one.
   */
  busiest: TimeOfDay | null
}

export const PATTERN_DAYS = 30

/** What the last `days` days of cravings add up to, or null if there were none. */
export function summariseCravings(
  records: CravingRecord[],
  now: Date = new Date(),
  days: number = PATTERN_DAYS,
): CravingSummary | null {
  const since = now.getTime() - days * 24 * 60 * 60 * 1000
  const recent = records.filter((r) => r.createdAt.getTime() >= since)
  if (recent.length === 0) return null

  const triggers = CRAVING_TRIGGERS.map((trigger) => {
    const matching = recent.filter((r) => r.trigger === trigger)
    return {
      trigger,
      count: matching.length,
      passed: matching.filter((r) => r.outcome === "passed").length,
    }
  })
    .filter((t) => t.count > 0)
    // Array.prototype.sort is stable, so equal counts keep the list order.
    .sort((a, b) => b.count - a.count)

  const byPeriod = new Map<TimeOfDay, number>()
  for (const r of recent) {
    const period = timeOfDay(r.localHour)
    byPeriod.set(period, (byPeriod.get(period) ?? 0) + 1)
  }
  const ranked = [...byPeriod.entries()].sort((a, b) => b[1] - a[1])
  const busiest =
    ranked.length > 0 && (ranked.length === 1 || ranked[0][1] > ranked[1][1]) && recent.length >= 3
      ? ranked[0][0]
      : null

  const strengthSum = recent.reduce((sum, r) => sum + r.strength, 0)

  return {
    days,
    total: recent.length,
    passed: recent.filter((r) => r.outcome === "passed").length,
    averageStrength: Math.round((strengthSum / recent.length) * 10) / 10,
    triggers,
    busiest,
  }
}
