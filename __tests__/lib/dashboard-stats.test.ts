import { describe, it, expect } from "vitest"
import { deriveDashboardStats, type DashboardLog } from "@/lib/dashboard-stats"

const DAY = 86_400_000
const NOW = new Date("2025-03-01T12:00:00.000Z")

/** Newest first, the order getLogs returns. */
function logs(counts: number[]): DashboardLog[] {
  return counts.map((cigarettes, i) => ({
    id: `log-${i}`,
    ts: new Date(NOW.getTime() - i * DAY),
    cigarettes,
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
    expect(stats.cigarettesNotSmoked).toBeGreaterThan(0)
    expect(stats.moneySaved).toBeGreaterThan(0)
  })

  it("takes the daily rate from before the quit day, not after it", () => {
    // 10 a day while smoking, 4 days clean -> 40 cigarettes avoided.
    const stats = deriveDashboardStats(logs([0, 0, 0, 0, 10, 10, 10]), NOW)

    expect(stats.smokeFreeDays).toBe(3)
    expect(stats.cigarettesNotSmoked).toBe(30)
    expect(stats.moneySaved).toBeCloseTo(15, 5)
  })

  it("assumes a rate when there is no smoking history to measure", () => {
    const stats = deriveDashboardStats(logs([0, 0]), NOW)

    expect(stats.smokeFreeDays).toBe(1)
    expect(stats.cigarettesNotSmoked).toBe(15)
  })

  it("reports no streak before the first smoke-free day", () => {
    const stats = deriveDashboardStats(logs([8, 9, 10]), NOW)

    expect(stats.quitDate).toBeNull()
    expect(stats.smokeFreeDays).toBe(0)
    expect(stats.cigarettesNotSmoked).toBe(0)
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

  it("counts no streak at all when the most recent day was a smoking day", () => {
    const stats = deriveDashboardStats(logs([3, 0, 0, 0]), NOW)

    expect(stats.quitDate).toBeNull()
    expect(stats.smokeFreeDays).toBe(0)
  })

  it("knows whether today has been logged", () => {
    expect(deriveDashboardStats(logs([0, 0]), NOW).hasLoggedToday).toBe(true)

    const stale: DashboardLog[] = [
      { id: "a", ts: new Date(NOW.getTime() - 2 * DAY), cigarettes: 0 },
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
    expect(stated.cigarettesNotSmoked).toBeGreaterThan(inferred.cigarettesNotSmoked)
  })

  it("still infers a baseline when none was stated", () => {
    const stats = deriveDashboardStats(logs([0, 0, 10, 10]), NOW, {})
    expect(stats.baselinePerDay).toBe(10)
  })

  it("reckons savings at the price the person actually pays", () => {
    // 2 days clean at 10 a day = 20 cigarettes. At 0.75 each that is 15.
    const stats = deriveDashboardStats(logs([0, 0, 0, 10]), NOW, {
      baselinePerDay: 10,
      pricePerCigarette: 0.75,
    })

    expect(stats.cigarettesNotSmoked).toBe(20)
    expect(stats.moneySaved).toBeCloseTo(15, 5)
  })

  it("falls back to the documented price when none is set", () => {
    const stats = deriveDashboardStats(logs([0, 0, 0, 10]), NOW, { baselinePerDay: 10 })
    expect(stats.moneySaved).toBeCloseTo(20 * 0.5, 5)
  })

  it("ignores a nonsensical price rather than showing a negative saving", () => {
    const stats = deriveDashboardStats(logs([0, 0, 0, 10]), NOW, {
      baselinePerDay: 10,
      pricePerCigarette: -3,
    })
    expect(stats.moneySaved).toBeGreaterThanOrEqual(0)
  })

  it("counts nothing for an empty log", () => {
    const stats = deriveDashboardStats([], NOW)

    expect(stats.daysTracked).toBe(0)
    expect(stats.hasLoggedToday).toBe(false)
    expect(stats.moneySaved).toBe(0)
  })
})
