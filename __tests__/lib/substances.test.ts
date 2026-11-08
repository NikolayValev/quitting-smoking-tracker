import { describe, it, expect } from "vitest"
import {
  combinedSeries,
  describeCheckIn,
  seriesFor,
  streakLabel,
  tracked,
  type CheckIn,
} from "@/lib/substances"

const day = (i: number, cigarettes: number | null, sessions: number | null): CheckIn => ({
  id: `d-${i}`,
  ts: new Date(Date.UTC(2025, 2, 1 - i, 12)),
  cigarettes,
  sessions,
})

describe("tracked", () => {
  it("lists cigarettes first when quitting both", () => {
    expect(tracked("both")).toEqual(["cigarettes", "cannabis"])
    expect(tracked("cannabis")).toEqual(["cannabis"])
  })
})

describe("seriesFor", () => {
  it("keeps only the days that recorded that substance", () => {
    // Someone who added cannabis later has older days with no session count.
    // Those are not cannabis-free days, they are days nobody asked about.
    const checkIns = [day(0, 0, 0), day(1, 0, 2), day(2, 5, null)]

    expect(seriesFor(checkIns, "cannabis").map((l) => l.count)).toEqual([0, 2])
    expect(seriesFor(checkIns, "cigarettes").map((l) => l.count)).toEqual([0, 0, 5])
  })
})

describe("combinedSeries", () => {
  it("is clean only on a day nothing was used", () => {
    const counts = combinedSeries([day(0, 0, 0), day(1, 0, 1), day(2, null, 0)]).map(
      (l) => l.count,
    )
    expect(counts).toEqual([0, 1, 0])
  })

  it("carries nothing that says which substance it was", () => {
    const [log] = combinedSeries([day(0, null, 3)])
    expect(Object.keys(log).sort()).toEqual(["count", "id", "note", "ts"])
  })
})

describe("describeCheckIn", () => {
  it("names each count in its own words", () => {
    expect(describeCheckIn(day(0, 0, null), "cigarettes")).toBe("Smoke-free")
    expect(describeCheckIn(day(0, 4, null), "cigarettes")).toBe("4 cigarettes")
    expect(describeCheckIn(day(0, null, 1), "cannabis")).toBe("Cannabis 1 time")
    expect(describeCheckIn(day(0, 0, 2), "both")).toBe("Smoke-free · Cannabis 2 times")
  })

  it("still describes a day from before a change of quit", () => {
    // Switched from cigarettes to cannabis: the old days have no session count.
    expect(describeCheckIn(day(5, 3, null), "cannabis")).toBe("3 cigarettes")
  })
})

describe("streakLabel", () => {
  it("says what the streak is free of", () => {
    expect(streakLabel("cigarettes")).toBe("smoke-free")
    expect(streakLabel("cannabis")).toBe("cannabis-free")
    expect(streakLabel("both")).toBe("free of both")
  })
})
