import { describe, it, expect } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { UrgeResistance } from "@/components/urge-resistance"

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
})
