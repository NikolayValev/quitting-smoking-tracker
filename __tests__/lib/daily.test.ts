import { describe, it, expect } from "vitest"
import { pickForToday } from "@/lib/daily"

const items = ["a", "b", "c", "d", "e"] as const

describe("pickForToday", () => {
  it("returns the same item for every moment within one day", () => {
    const morning = new Date("2026-03-05T00:00:01Z")
    const evening = new Date("2026-03-05T23:59:59Z")
    expect(pickForToday(items, morning)).toBe(pickForToday(items, evening))
  })

  it("advances to the next item on the following day", () => {
    const day1 = new Date("2026-03-05T12:00:00Z")
    const day2 = new Date("2026-03-06T12:00:00Z")
    const i1 = items.indexOf(pickForToday(items, day1) as (typeof items)[number])
    const i2 = items.indexOf(pickForToday(items, day2) as (typeof items)[number])
    expect(i2).toBe((i1 + 1) % items.length)
  })

  it("wraps around rather than running off the end of the list", () => {
    // Walk a full year; every result must be a real member of the list.
    for (let d = 0; d < 366; d++) {
      const date = new Date(Date.UTC(2026, 0, 1 + d, 12))
      expect(items).toContain(pickForToday(items, date))
    }
  })

  it("is stable across years for the same calendar day", () => {
    const a = pickForToday(items, new Date("2026-02-10T12:00:00Z"))
    const b = pickForToday(items, new Date("2026-02-10T06:00:00Z"))
    expect(a).toBe(b)
  })

  it("throws on an empty list rather than returning undefined", () => {
    expect(() => pickForToday([], new Date())).toThrow()
  })
})
