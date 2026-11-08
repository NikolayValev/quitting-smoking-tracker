import { describe, it, expect } from "vitest"
import { deriveDashboardStats, type DashboardLog } from "@/lib/dashboard-stats"

const DAY = 86_400_000
const NOW = new Date("2025-03-01T12:00:00.000Z")

/** Newest first, the order getLogs returns. */
function logs(counts: number[]): DashboardLog[] {
  return counts.map((cigarettes, i) => ({
    id: `log-${i}`,
    ts: new Date(NOW.getTime() - i * DAY),
    count: cigarettes,
  }))
}

describe("deriveDashboardStats", () => {
  it("keeps counting savings once the recent days are all smoke-free", () => {
    // The regression this pins: averaging the last seven logs made the rate 0
    // as soon as someone had been clean a week, so the two figures that exist
    // to encourage them both collapsed to zero exactly when they were earning
    // them. The baseline has to come from the smoking period.
    const stats = deriveDashboardStats(logs([...Array(10).fill(0), 20, 20]), NOW)

    expect(stats.smokeFreeDays).toBe(9)
    expect(stats.notUsed).toBeGreaterThan(0)
    expect(stats.moneySaved).toBeGreaterThan(0)
  })

  it("takes the daily rate from before the quit day, not after it", () => {
    // 10 a day while smoking, 4 days clean -> 40 cigarettes avoided.
    const stats = deriveDashboardStats(logs([0, 0, 0, 0, 10, 10, 10]), NOW)

    expect(stats.smokeFreeDays).toBe(3)
    expect(stats.notUsed).toBe(30)
    expect(stats.moneySaved).toBeCloseTo(15, 5)
  })

  it("assumes a rate when there is no smoking history to measure", () => {
    const stats = deriveDashboardStats(logs([0, 0]), NOW)

    expect(stats.smokeFreeDays).toBe(1)
    expect(stats.notUsed).toBe(15)
  })

  it("reports no streak before the first smoke-free day", () => {
    const stats = deriveDashboardStats(logs([8, 9, 10]), NOW)

    expect(stats.quitDate).toBeNull()
    expect(stats.smokeFreeDays).toBe(0)
    expect(stats.notUsed).toBe(0)
    expect(stats.moneySaved).toBe(0)
  })

  it("dates the streak from the earliest smoke-free day, not the latest", () => {
    const stats = deriveDashboardStats(logs([0, 0, 0, 5]), NOW)

    expect(stats.smokeFreeDays).toBe(2)
  })

  it("restarts the streak after a relapse instead of counting through it", () => {
    // Newest first: three clean days, a slip, then a long earlier clean run.
    const stats = deriveDashboardStats(
      logs([0, 0, 0, 6, ...Array(30).fill(0)]),
      NOW,
    )

    // Three days, not thirty-three. Telling someone who smoked on Tuesday that
    // they are a month clean is the one number this app must not get wrong.
    expect(stats.smokeFreeDays).toBe(2)
  })

  it("keeps what earlier clean days avoided when the latest day was a slip", () => {
    // The streak restarts, but the cigarettes not smoked before the slip were
    // still not smoked. Zeroing them told someone a month in, after three
    // cigarettes, that quitting had saved them nothing.
    const stats = deriveDashboardStats(logs([5, 0, 0, 0, 0, 10, 10]), NOW, {
      baselinePerDay: 10,
      pricePerUnit: 0.5,
    })

    expect(stats.quitDate).toBeNull()
    // Four clean days at 10, plus the 5 not smoked on the slip day itself.
    expect(stats.notUsed).toBe(45)
    expect(stats.moneySaved).toBeCloseTo(22.5, 5)
  })

  it("adds earlier clean stretches to the current one", () => {
    // Current streak: 2 days at 10. Before it: a slip of 6 (4 avoided) and two
    // clean days (20). The tapering day before the first quit counts nothing.
    const stats = deriveDashboardStats(logs([0, 0, 0, 6, 0, 0, 10]), NOW, {
      baselinePerDay: 10,
    })

    expect(stats.smokeFreeDays).toBe(2)
    expect(stats.notUsed).toBe(44)
  })

  it("counts no streak at all when the most recent day was a smoking day", () => {
    const stats = deriveDashboardStats(logs([3, 0, 0, 0]), NOW)

    expect(stats.quitDate).toBeNull()
    expect(stats.smokeFreeDays).toBe(0)
  })

  it("knows whether today has been logged", () => {
    expect(deriveDashboardStats(logs([0, 0]), NOW).hasLoggedToday).toBe(true)

    const stale: DashboardLog[] = [
      { id: "a", ts: new Date(NOW.getTime() - 2 * DAY), count: 0 },
    ]
    expect(deriveDashboardStats(stale, NOW).hasLoggedToday).toBe(false)
  })

  it("prefers a stated baseline over the average of the smoking days", () => {
    // Someone who smoked 20 a day for years but only logged the tapering-off
    // week would otherwise have their savings reckoned against the taper, which
    // understates what quitting is actually worth to them.
    const log = logs([0, 0, 0, 4, 4])
    const inferred = deriveDashboardStats(log, NOW)
    const stated = deriveDashboardStats(log, NOW, { baselinePerDay: 20 })

    expect(inferred.baselinePerDay).toBe(4)
    expect(stated.baselinePerDay).toBe(20)
    expect(stated.notUsed).toBeGreaterThan(inferred.notUsed)
  })

  it("still infers a baseline when none was stated", () => {
    const stats = deriveDashboardStats(logs([0, 0, 10, 10]), NOW, {})
    expect(stats.baselinePerDay).toBe(10)
  })

  it("reckons savings at the price the person actually pays", () => {
    // 2 days clean at 10 a day = 20 cigarettes. At 0.75 each that is 15.
    const stats = deriveDashboardStats(logs([0, 0, 0, 10]), NOW, {
      baselinePerDay: 10,
      pricePerUnit: 0.75,
    })

    expect(stats.notUsed).toBe(20)
    expect(stats.moneySaved).toBeCloseTo(15, 5)
  })

  it("falls back to the documented price when none is set", () => {
    const stats = deriveDashboardStats(logs([0, 0, 0, 10]), NOW, { baselinePerDay: 10 })
    expect(stats.moneySaved).toBeCloseTo(20 * 0.5, 5)
  })

  it("ignores a nonsensical price rather than showing a negative saving", () => {
    const stats = deriveDashboardStats(logs([0, 0, 0, 10]), NOW, {
      baselinePerDay: 10,
      pricePerUnit: -3,
    })
    expect(stats.moneySaved).toBeGreaterThanOrEqual(0)
  })

  it("counts nothing for an empty log", () => {
    const stats = deriveDashboardStats([], NOW)

    expect(stats.daysTracked).toBe(0)
    expect(stats.hasLoggedToday).toBe(false)
    expect(stats.moneySaved).toBe(0)
  })

  it("reports no saving rather than a guessed price when told to", () => {
    // Cannabis prices vary too much for a fallback to mean anything.
    const stats = deriveDashboardStats(logs([0, 0, 0, 2, 2]), NOW, {
      fallbackPrice: null,
      assumedPerDay: 1,
    })

    expect(stats.notUsed).toBe(4)
    expect(stats.moneySaved).toBeNull()
  })

  it("uses the assumed rate it is given when there is no history", () => {
    const stats = deriveDashboardStats(logs([0, 0, 0]), NOW, { assumedPerDay: 1, pricePerUnit: 5 })

    expect(stats.notUsed).toBe(2)
    expect(stats.moneySaved).toBe(10)
  })
})
