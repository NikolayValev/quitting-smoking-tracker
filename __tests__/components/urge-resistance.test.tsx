import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { UrgeResistance } from "@/components/urge-resistance"

// A server action: under Next it becomes a network call; here it is a spy.
vi.mock("@/app/wellness/actions", () => ({ recordCraving: vi.fn() }))
vi.mock("@/lib/analytics/posthog", () => ({ captureCraving: vi.fn() }))

describe("UrgeResistance", () => {
  it("offers every strategy as a choice", () => {
    // The component no longer carries a heading or blurb of its own: the page
    // labels the section, and a card-inside-a-card put three borders around
    // four links. What it owes the page is the choices themselves.
    render(<UrgeResistance />)

    const choices = screen.getAllByRole("button")
    expect(choices.length).toBeGreaterThanOrEqual(4)
  })

  it("offers plans for the moments cigarettes are tied to", () => {
    render(<UrgeResistance />)

    expect(screen.getByText("The first one of the morning")).toBeInTheDocument()
    expect(screen.getByText("With coffee")).toBeInTheDocument()
    expect(screen.getByText("With a drink")).toBeInTheDocument()
  })

  it("navigates to strategy details when clicked", () => {
    render(<UrgeResistance />)

    const strategyButton = screen.getByText("With coffee")
    fireEvent.click(strategyButton)

    expect(screen.getByText("Back")).toBeInTheDocument()
  })

  it("tracks completed steps", () => {
    render(<UrgeResistance />)

    const strategyButton = screen.getByText("With coffee")
    fireEvent.click(strategyButton)

    const steps = screen.getAllByRole("button")
    const firstStep = steps.find((btn) => btn.textContent?.includes("half-strength"))

    if (firstStep) {
      fireEvent.click(firstStep)
      expect(firstStep.querySelector(".line-through")).toBeInTheDocument()
    }
  })

  it("shows completion message when all steps are done", () => {
    render(<UrgeResistance />)

    const strategyButton = screen.getByText("With coffee")
    fireEvent.click(strategyButton)

    const stepButtons = screen.getAllByRole("button").filter((btn) => !btn.textContent?.includes("Back"))

    stepButtons.forEach((btn) => fireEvent.click(btn))

    expect(screen.getByText(/passed without a cigarette/i)).toBeInTheDocument()
  })

  describe("recording a craving", () => {
    beforeEach(() => vi.clearAllMocks())

    it("needs a strength before either outcome can be chosen", () => {
      render(<UrgeResistance />)
      fireEvent.click(screen.getByText("With a drink"))

      expect(screen.getByRole("button", { name: "It passed" })).toBeDisabled()
      expect(screen.getByRole("button", { name: "I smoked" })).toBeDisabled()
    })

    it("records the plan's moment as the trigger, with the hour on this clock", async () => {
      const { recordCraving } = await import("@/app/wellness/actions")
      vi.mocked(recordCraving).mockResolvedValue({ success: true })

      render(<UrgeResistance />)
      fireEvent.click(screen.getByText("With a drink"))
      fireEvent.click(screen.getByRole("radio", { name: "4" }))
      fireEvent.click(screen.getByRole("button", { name: "It passed" }))

      await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Recorded"))
      expect(recordCraving).toHaveBeenCalledWith({
        substance: "cigarettes",
        trigger: "drink",
        strength: 4,
        outcome: "passed",
        localHour: new Date().getHours(),
      })
    })

    it("records a moment that is not on the list as 'other'", async () => {
      const { recordCraving } = await import("@/app/wellness/actions")
      vi.mocked(recordCraving).mockResolvedValue({ success: true })

      render(<UrgeResistance />)
      fireEvent.click(screen.getByText(/Something else\? Record it anyway/))
      fireEvent.click(screen.getByRole("radio", { name: "2" }))
      fireEvent.click(screen.getByRole("button", { name: "I smoked" }))

      // A slip is met with the next step, not a verdict.
      await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("slip, not the end"))
      expect(vi.mocked(recordCraving).mock.calls[0][0]).toMatchObject({ trigger: "other", outcome: "smoked" })
    })

    it("offers cannabis plans and records against cannabis, in its own words", async () => {
      const { recordCraving } = await import("@/app/wellness/actions")
      vi.mocked(recordCraving).mockResolvedValue({ success: true })

      render(<UrgeResistance substance="cannabis" />)
      expect(screen.queryByText("With coffee")).toBeNull()
      fireEvent.click(screen.getByText("To get to sleep"))
      fireEvent.click(screen.getByRole("radio", { name: "3" }))
      fireEvent.click(screen.getByRole("button", { name: "I used" }))

      await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Using once is a slip"))
      expect(vi.mocked(recordCraving).mock.calls[0][0]).toMatchObject({
        substance: "cannabis",
        trigger: "sleep",
        outcome: "smoked",
      })
    })

    it("does not tell analytics which cannabis plan was opened", async () => {
      // The id alone would say what the person is quitting.
      const { captureCraving } = await import("@/lib/analytics/posthog")

      render(<UrgeResistance substance="cannabis" />)
      fireEvent.click(screen.getByText("With people who use"))
      expect(captureCraving).toHaveBeenLastCalledWith(undefined)

      render(<UrgeResistance />)
      fireEvent.click(screen.getByText("With coffee"))
      expect(captureCraving).toHaveBeenLastCalledWith("coffee")
    })
  })
})
