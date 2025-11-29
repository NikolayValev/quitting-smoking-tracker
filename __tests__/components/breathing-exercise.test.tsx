import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { BreathingExercise } from "@/components/breathing-exercise"

describe("BreathingExercise", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("renders breathing exercise component", () => {
    render(<BreathingExercise />)

    expect(screen.getByText("Breathing Exercise")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /start breathing exercise/i })).toBeInTheDocument()
  })

  it("starts exercise when start button is clicked", async () => {
    render(<BreathingExercise />)

    const startButton = screen.getByRole("button", { name: /start breathing exercise/i })
    fireEvent.click(startButton)

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /pause breathing exercise/i })).toBeInTheDocument()
    })
  })

  it("displays correct initial phase", () => {
    render(<BreathingExercise />)

    expect(screen.getByText("Breathe In")).toBeInTheDocument()
    expect(screen.getByText("4")).toBeInTheDocument()
  })

  it("resets exercise when reset button is clicked", async () => {
    render(<BreathingExercise />)

    const startButton = screen.getByRole("button", { name: /start breathing exercise/i })
    fireEvent.click(startButton)

    const resetButton = screen.getByRole("button", { name: /reset breathing exercise/i })
    fireEvent.click(resetButton)

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /start breathing exercise/i })).toBeInTheDocument()
      expect(screen.getByText("Breathe In")).toBeInTheDocument()
    })
  })
})
