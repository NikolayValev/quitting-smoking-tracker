import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, act } from "@testing-library/react"
import { BreathingExercise } from "@/components/breathing-exercise"

describe("BreathingExercise", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("renders breathing exercise component", () => {
    render(<BreathingExercise />)

    expect(screen.getByText("Breathing Exercise")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /start breathing exercise/i })).toBeInTheDocument()
  })

  it("starts exercise when start button is clicked", async () => {
    render(<BreathingExercise />)

    const startButton = screen.getByRole("button", { name: /start breathing exercise/i })

    await act(async () => {
      fireEvent.click(startButton)
    })

    expect(screen.getByRole("button", { name: /pause breathing exercise/i })).toBeInTheDocument()
  })

  it("displays correct initial phase", () => {
    render(<BreathingExercise />)

    expect(screen.getByText("Breathe In")).toBeInTheDocument()
    expect(screen.getByText("4")).toBeInTheDocument()
  })

  it("resets exercise when reset button is clicked", async () => {
    render(<BreathingExercise />)

    const startButton = screen.getByRole("button", { name: /start breathing exercise/i })

    await act(async () => {
      fireEvent.click(startButton)
    })

    const resetButton = screen.getByRole("button", { name: /reset breathing exercise/i })

    await act(async () => {
      fireEvent.click(resetButton)
    })

    expect(screen.getByRole("button", { name: /start breathing exercise/i })).toBeInTheDocument()
    expect(screen.getByText("Breathe In")).toBeInTheDocument()
  })
})
