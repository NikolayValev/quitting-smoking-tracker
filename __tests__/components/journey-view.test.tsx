import React from "react"
import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { JourneyView, type JourneyEntry } from "@/components/journey-view"

// Recharts measures its container, which jsdom cannot do; the chart is not what
// these assertions are about.
vi.mock("@/components/journey-chart", () => ({
  JourneyChart: () => <div data-testid="chart" />,
}))

const NOW = new Date("2025-03-01T12:00:00.000Z")
const DAY = 86_400_000

/** Newest first, the order getLogs returns. */
function entries(
  spec: Array<{ cigarettes: number; note?: string }>,
): JourneyEntry[] {
  return spec.map((s, i) => ({
    id: `e-${i}`,
    ts: new Date(NOW.getTime() - i * DAY),
    cigarettes: s.cigarettes,
    note: s.note ?? null,
  }))
}

describe("JourneyView", () => {
  it("collapses an unbroken run of plain smoke-free days into one row", () => {
    render(
      <JourneyView entries={entries(Array(12).fill({ cigarettes: 0 }))} now={NOW} />,
    )

    expect(screen.getByText("12 days smoke-free")).toBeInTheDocument()
    // Not twelve rows saying the same word.
    expect(screen.queryByText("Smoke-free")).toBeNull()
  })

  it("never swallows a day someone wrote a note on", () => {
    const log = entries([
      { cigarettes: 0 },
      { cigarettes: 0, note: "Hardest one yet." },
      { cigarettes: 0 },
      { cigarettes: 0 },
    ])

    render(<JourneyView entries={log} now={NOW} />)

    expect(screen.getByText("Hardest one yet.")).toBeInTheDocument()
  })

  it("keeps smoking days as their own rows", () => {
    render(
      <JourneyView
        entries={entries([{ cigarettes: 0 }, { cigarettes: 0 }, { cigarettes: 4 }])}
        now={NOW}
      />,
    )

    expect(screen.getByText("4 cigarettes")).toBeInTheDocument()
    expect(screen.getByText("2 days smoke-free")).toBeInTheDocument()
  })

  it("does not collapse a single day into a run of one", () => {
    render(
      <JourneyView entries={entries([{ cigarettes: 0 }, { cigarettes: 3 }])} now={NOW} />,
    )

    expect(screen.getByText("Smoke-free")).toBeInTheDocument()
    expect(screen.queryByText("1 days smoke-free")).toBeNull()
  })

  it("reports the worst day, not the most recent one", () => {
    render(
      <JourneyView
        entries={entries([{ cigarettes: 0 }, { cigarettes: 2 }, { cigarettes: 11 }])}
        now={NOW}
      />,
    )

    expect(screen.getByText("11")).toBeInTheDocument()
  })
})
