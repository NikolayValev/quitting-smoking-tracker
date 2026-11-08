import { describe, it, expect } from "vitest"
import { getTableConfig } from "drizzle-orm/pg-core"
import { cravings } from "@/db/schema"
import { copingStrategies } from "@/lib/data/wellness-tips"
import {
  CRAVING_TRIGGERS,
  summariseCravings,
  timeOfDay,
  triggerLabel,
  type CravingRecord,
} from "@/lib/cravings"

const NOW = new Date("2025-03-01T12:00:00Z")
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 24 * 60 * 60 * 1000)

function craving(overrides: Partial<CravingRecord> = {}): CravingRecord {
  return {
    createdAt: daysAgo(1),
    trigger: "coffee",
    strength: 3,
    outcome: "passed",
    localHour: 9,
    ...overrides,
  }
}

describe("craving triggers", () => {
  it("are the coping-strategy moments plus 'other', in the schema too", () => {
    // The wellness screen records a strategy id as the trigger. If a strategy
    // is added without a trigger, recording it fails at the database.
    expect([...CRAVING_TRIGGERS]).toEqual([...copingStrategies.map((s) => s.id), "other"])

    const column = getTableConfig(cravings).columns.find((c) => c.name === "trigger")
    expect(column?.enumValues).toEqual([...CRAVING_TRIGGERS])
  })

  it("are labelled the way the wellness screen names them", () => {
    expect(triggerLabel("coffee")).toBe("With coffee")
    expect(triggerLabel("other")).toBe("Something else")
  })
})

describe("timeOfDay", () => {
  it("puts the small hours with the night, not the morning", () => {
    expect(timeOfDay(3)).toBe("night")
    expect(timeOfDay(5)).toBe("morning")
    expect(timeOfDay(12)).toBe("afternoon")
    expect(timeOfDay(17)).toBe("evening")
    expect(timeOfDay(22)).toBe("night")
  })
})

describe("summariseCravings", () => {
  it("is null with nothing recorded in the window", () => {
    expect(summariseCravings([], NOW)).toBeNull()
    expect(summariseCravings([craving({ createdAt: daysAgo(31) })], NOW)).toBeNull()
  })

  it("counts how many passed and ranks triggers by how often they come up", () => {
    const summary = summariseCravings(
      [
        craving({ trigger: "drink", outcome: "smoked", strength: 5 }),
        craving({ trigger: "drink", strength: 4 }),
        craving({ trigger: "coffee", strength: 2 }),
        craving({ trigger: "stress", strength: 3 }),
      ],
      NOW,
    )!

    expect(summary.total).toBe(4)
    expect(summary.passed).toBe(3)
    expect(summary.averageStrength).toBe(3.5)
    expect(summary.triggers).toEqual([
      { trigger: "drink", count: 2, passed: 1 },
      // A tie keeps the wellness screen's order.
      { trigger: "coffee", count: 1, passed: 1 },
      { trigger: "stress", count: 1, passed: 1 },
    ])
  })

  it("names the busiest time of day only when one clearly stands out", () => {
    const evenings = [19, 20, 21, 9].map((localHour) => craving({ localHour }))
    expect(summariseCravings(evenings, NOW)!.busiest).toBe("evening")

    // Two mornings and two evenings is not a pattern.
    const tied = [8, 9, 19, 20].map((localHour) => craving({ localHour }))
    expect(summariseCravings(tied, NOW)!.busiest).toBeNull()

    // Nor is one craving, or two.
    expect(summariseCravings([craving()], NOW)!.busiest).toBeNull()
  })
})
