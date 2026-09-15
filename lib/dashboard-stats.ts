export type DashboardLog = {
  id: string
  ts: Date | string
  cigarettes: number
  note?: string | null
}

export type DashboardStats = {
  /** Null until the person has logged at least one smoke-free day. */
  quitDate: Date | null
  smokeFreeDays: number
  smokeFreeHours: number
  cigarettesNotSmoked: number
  moneySaved: number
  daysTracked: number
  hasLoggedToday: boolean
  /** Cigarettes a day while smoking — what the savings are reckoned against. */
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
  /** Cigarettes a day before quitting, as stated rather than inferred. */
  baselinePerDay?: number | null
  pricePerCigarette?: number | null
}

/** Fallback daily rate before there is enough history to average. */
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
  for (const log of logs) {
    if (log.cigarettes !== 0) break
    streakStart = log
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
  const smokingDays = logs.filter((log) => log.cigarettes > 0)
  const inferred =
    smokingDays.length > 0
      ? smokingDays.reduce((sum, log) => sum + log.cigarettes, 0) / smokingDays.length
      : ASSUMED_DAILY_COUNT
  const avgPerDay =
    settings.baselinePerDay && settings.baselinePerDay > 0
      ? settings.baselinePerDay
      : inferred

  // A negative or zero price is not a discount; fall back rather than render a
  // saving of nothing, or worse, a negative one.
  const pricePerCigarette =
    settings.pricePerCigarette && settings.pricePerCigarette > 0
      ? settings.pricePerCigarette
      : COST_PER_CIGARETTE_USD

  const cigarettesNotSmoked =
    smokeFreeMinutes > 0 ? Math.floor((smokeFreeMinutes / 1440) * avgPerDay) : 0

  return {
    quitDate,
    smokeFreeDays: Math.floor(smokeFreeMinutes / 1440),
    smokeFreeHours: Math.floor((smokeFreeMinutes % 1440) / 60),
    cigarettesNotSmoked,
    moneySaved: cigarettesNotSmoked * pricePerCigarette,
    baselinePerDay: Math.round(avgPerDay),
    daysTracked: logs.length,
    hasLoggedToday:
      logs.length > 0 && at(logs[0]).toDateString() === now.toDateString(),
  }
}
