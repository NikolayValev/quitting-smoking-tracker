import { describe, it, expect } from "vitest"
import { WITHDRAWAL_PHASES, withdrawalPhase } from "@/lib/withdrawal"
import { CANNABIS_WITHDRAWAL } from "@/lib/data/cannabis"

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

  it("runs cannabis on its own clock: a week at the peak, sleep last", () => {
    expect(withdrawalPhase(0, "cannabis").id).toBe("first-days")
    expect(withdrawalPhase(3, "cannabis").id).toBe("peak")
    expect(withdrawalPhase(6, "cannabis").id).toBe("peak")
    expect(withdrawalPhase(7, "cannabis").id).toBe("easing")
    expect(withdrawalPhase(20, "cannabis").id).toBe("sleep")
    expect(withdrawalPhase(400, "cannabis").id).toBe("behind-you")
  })

  it("orders the cannabis phases too", () => {
    const starts = CANNABIS_WITHDRAWAL.map((p) => p.fromDay)
    expect(starts[0]).toBe(0)
    expect([...starts].sort((a, b) => a - b)).toEqual(starts)
    expect(new Set(starts).size).toBe(starts.length)
  })
})
