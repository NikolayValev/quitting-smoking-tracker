/**
 * One day of one substance: how many cigarettes, or how many times cannabis
 * was used. lib/substances turns a stored check-in into these.
 */
export type DashboardLog = {
  id: string
  ts: Date | string
  count: number
  note?: string | null
}

export type DashboardStats = {
  /** Null until the person has logged at least one smoke-free day. */
  quitDate: Date | null
  smokeFreeDays: number
  smokeFreeHours: number
  /** Cigarettes not smoked, or times cannabis was not used. */
  notUsed: number
  /** Null when there is no price to reckon it at. */
  moneySaved: number | null
  daysTracked: number
  hasLoggedToday: boolean
  /** A day's count while still using — what the savings are reckoned against. */
  baselinePerDay: number
}

/** Rough US pack price divided by twenty, used until someone states their own. */
export const COST_PER_CIGARETTE_USD = 0.5

/**
 * What the person told us, where they have told us anything.
 *
 * Both are optional and both fall back to the existing inference, so a half
 * finished onboarding degrades to the old behaviour rather than to zero.
 */
export type StatsSettings = {
  /** A day's count before quitting, as stated rather than inferred. */
  baselinePerDay?: number | null
  /** The price of one cigarette, or one session. */
  pricePerUnit?: number | null
  /** The daily rate to assume before there is any history to average. */
  assumedPerDay?: number
  /**
   * The price to assume when none is stated, or null to report no saving.
   * Cigarettes have a rough pack price to fall back on; cannabis prices vary
   * too much for a guess to mean anything.
   */
  fallbackPrice?: number | null
}

/** Fallback daily rate for cigarettes before there is enough history to average. */
const ASSUMED_DAILY_COUNT = 15

/**
 * Derives everything the dashboard shows from a log list, newest first.
 *
 * Pulled out of the page so the arithmetic can be tested without a database or
 * a signed-in user, and so the dashboard body can be rendered from fixtures.
 *
 * `now` is injectable for the same reason: every figure here is relative to the
 * current time, which is untestable if it is read from the clock inside.
 */
export function deriveDashboardStats(
  logs: DashboardLog[],
  now: Date = new Date(),
  settings: StatsSettings = {},
): DashboardStats {
  const at = (log: DashboardLog) => new Date(log.ts)

  // The streak is the current unbroken run of smoke-free days, walking back
  // from the newest entry. Taking the earliest smoke-free day ever logged
  // would keep counting straight through a relapse and tell someone who smoked
  // yesterday that they are two hundred days clean.
  let streakStart: DashboardLog | null = null
  let streakLength = 0
  for (const log of logs) {
    if (log.count !== 0) break
    streakStart = log
    streakLength++
  }
  const quitDate = streakStart ? at(streakStart) : null

  const smokeFreeMinutes = quitDate
    ? Math.max(0, Math.floor((now.getTime() - quitDate.getTime()) / 60000))
    : 0

  // The daily rate comes from the days they actually smoked. Averaging the most
  // recent week instead made this zero the moment someone had been clean for a
  // week, so the savings stopped growing exactly when they started to mean
  // something.
  // A stated baseline wins over the inferred one. Someone who smoked twenty a
  // day for years but only logged the week they spent tapering off would
  // otherwise have their savings measured against the taper.
  const smokingDays = logs.filter((log) => log.count > 0)
  const inferred =
    smokingDays.length > 0
      ? smokingDays.reduce((sum, log) => sum + log.count, 0) / smokingDays.length
      : (settings.assumedPerDay ?? ASSUMED_DAILY_COUNT)
  const avgPerDay =
    settings.baselinePerDay && settings.baselinePerDay > 0
      ? settings.baselinePerDay
      : inferred

  // A negative or zero price is not a discount; fall back rather than render a
  // saving of nothing, or worse, a negative one.
  const fallbackPrice =
    settings.fallbackPrice === undefined ? COST_PER_CIGARETTE_USD : settings.fallbackPrice
  const pricePerUnit =
    settings.pricePerUnit && settings.pricePerUnit > 0 ? settings.pricePerUnit : fallbackPrice

  // A slip restarts the streak, not the savings: what was not smoked before it
  // still was not smoked. Days logged before the current streak count what each
  // fell short of the baseline, from the first smoke-free day on, so the taper
  // before quitting is not counted as savings.
  const firstSmokeFree = logs.findLastIndex((log) => log.count === 0)
  const avoidedEarlier = logs
    .slice(streakLength, firstSmokeFree + 1)
    .reduce((sum, log) => sum + Math.max(0, avgPerDay - log.count), 0)

  const notUsed = Math.floor(
    (smokeFreeMinutes / 1440) * avgPerDay + avoidedEarlier,
  )

  return {
    quitDate,
    smokeFreeDays: Math.floor(smokeFreeMinutes / 1440),
    smokeFreeHours: Math.floor((smokeFreeMinutes % 1440) / 60),
    notUsed,
    moneySaved: pricePerUnit === null ? null : notUsed * pricePerUnit,
    baselinePerDay: Math.round(avgPerDay),
    daysTracked: logs.length,
    hasLoggedToday:
      logs.length > 0 && at(logs[0]).toDateString() === now.toDateString(),
  }
}
