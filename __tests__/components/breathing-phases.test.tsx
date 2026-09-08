import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, act } from "@testing-library/react"
import { BreathingExercise } from "@/components/breathing-exercise"

// Characterisation tests for the phase machine. These pin the timing that the
// component already has, so the refactor away from setState-in-effect can be
// verified as behaviour-preserving rather than assumed to be.
async function tick(seconds: number) {
  // One second per act() flush. Advancing the whole span in a single act does
  // not work: each tick schedules the next timer from an effect, which only
  // runs once React has committed the previous update.
  for (let i = 0; i < seconds; i++) {
    await act(async () => {
      vi.advanceTimersByTime(1000)
    })
  }
}

async function start() {
  render(<BreathingExercise />)
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: /start breathing exercise/i }))
  })
}

describe("BreathingExercise phase machine", () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it("holds Breathe In for its full 4 seconds", async () => {
    await start()
    await tick(3)
    expect(screen.getByText("Breathe In")).toBeInTheDocument()
  })

  it("advances Breathe In -> Hold after 4 seconds", async () => {
    await start()
    await tick(4)
    expect(screen.getByText("Hold")).toBeInTheDocument()
  })

  it("advances Hold -> Breathe Out after a further 4 seconds", async () => {
    await start()
    await tick(8)
    expect(screen.getByText("Breathe Out")).toBeInTheDocument()
  })

  it("returns to Breathe In after a full 16-second cycle", async () => {
    await start()
    // inhale 4 + hold 4 + exhale 6 + rest 2 = 16
    await tick(16)
    expect(screen.getByText("Breathe In")).toBeInTheDocument()
  })

  it("drives the progress bar across the phase", async () => {
    await start()
    const bar = () => screen.getByRole("progressbar").getAttribute("aria-valuenow")
    expect(bar()).toBe("0")
    await tick(1)
    expect(bar()).toBe("25")
    await tick(2)
    expect(bar()).toBe("75")
  })

  it("stops itself after five complete cycles", async () => {
    await start()
    await tick(16 * 5)
    expect(screen.getByRole("button", { name: /start breathing exercise/i })).toBeInTheDocument()
  })
})
