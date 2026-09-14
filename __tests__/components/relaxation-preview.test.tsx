import React from "react"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, act } from "@testing-library/react"
import { RelaxationPreview } from "@/components/relaxation-preview"
import { relaxationTechniques } from "@/lib/data/wellness-tips"

/**
 * Each tick schedules the next only after React re-renders, so advancing the
 * clock in one jump processes a single second. Step it instead.
 */
function tick(seconds: number) {
  for (let i = 0; i < seconds; i++) {
    act(() => void vi.advanceTimersByTime(1000))
  }
}

describe("RelaxationPreview", () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  const first = relaxationTechniques[0]

  it("counts the session down instead of only changing a label", () => {
    // What this pins: "Start session" used to toggle a dot and nothing else, so
    // the screen offered a timed session and ran no timer.
    render(<RelaxationPreview />)

    fireEvent.click(screen.getByRole("button", { name: new RegExp(`start ${first.title}`, "i") }))
    expect(screen.getByRole("timer")).toHaveTextContent(`${first.minutes}:00 left`)

    tick(3)
    expect(screen.getByRole("timer")).toHaveTextContent(`${first.minutes - 1}:57 left`)
  })

  it("says when the session is over", () => {
    render(<RelaxationPreview />)
    fireEvent.click(screen.getByRole("button", { name: new RegExp(`start ${first.title}`, "i") }))

    tick(first.minutes * 60)

    expect(screen.getByRole("timer")).toHaveTextContent("Done")
  })

  it("gives the time back when stopped early", () => {
    render(<RelaxationPreview />)
    fireEvent.click(screen.getByRole("button", { name: new RegExp(`start ${first.title}`, "i") }))

    tick(5)
    fireEvent.click(screen.getByRole("button", { name: /stop/i }))

    expect(screen.queryByRole("timer")).toBeNull()
    expect(
      screen.getByRole("button", { name: new RegExp(`start ${first.title}`, "i") }),
    ).toBeInTheDocument()
  })

  it("runs one session at a time", () => {
    render(<RelaxationPreview />)
    fireEvent.click(screen.getByRole("button", { name: new RegExp(`start ${first.title}`, "i") }))

    const second = relaxationTechniques[1]
    fireEvent.click(screen.getByRole("button", { name: new RegExp(`start ${second.title}`, "i") }))

    expect(screen.getAllByRole("timer")).toHaveLength(1)
    expect(screen.getByRole("timer")).toHaveTextContent(`${second.minutes}:00 left`)
  })

  it("offers every technique", () => {
    render(<RelaxationPreview />)
    for (const technique of relaxationTechniques) {
      expect(screen.getByText(technique.title)).toBeInTheDocument()
    }
  })
})
