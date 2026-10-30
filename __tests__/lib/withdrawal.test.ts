import { describe, it, expect } from "vitest"
import { WITHDRAWAL_PHASES, withdrawalPhase } from "@/lib/withdrawal"

describe("withdrawalPhase", () => {
  it("puts the peak on days two and three", () => {
    // Day indices are whole smoke-free days completed, so day two is index 1.
    expect(withdrawalPhase(0).id).toBe("day-one")
    expect(withdrawalPhase(1).id).toBe("peak")
    expect(withdrawalPhase(2).id).toBe("peak")
    expect(withdrawalPhase(3).id).toBe("habit")
  })

  it("moves through the month and settles after three", () => {
    expect(withdrawalPhase(7).id).toBe("week-two")
    expect(withdrawalPhase(29).id).toBe("weeks-three-four")
    expect(withdrawalPhase(30).id).toBe("just-one")
    expect(withdrawalPhase(89).id).toBe("just-one")
    expect(withdrawalPhase(5000).id).toBe("behind-you")
  })

  it("is ordered, so every day falls in exactly one phase", () => {
    const starts = WITHDRAWAL_PHASES.map((p) => p.fromDay)
    expect(starts[0]).toBe(0)
    expect([...starts].sort((a, b) => a - b)).toEqual(starts)
    expect(new Set(starts).size).toBe(starts.length)
  })
})
