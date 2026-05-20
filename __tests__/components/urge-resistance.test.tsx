import { describe, it, expect } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { UrgeResistance } from "@/components/urge-resistance"

describe("UrgeResistance", () => {
  it("renders urge resistance component", () => {
    render(<UrgeResistance />)

    expect(screen.getByText("Resist the Urge")).toBeInTheDocument()
    expect(screen.getByText("Choose a coping strategy to help you through this craving")).toBeInTheDocument()
  })

  it("displays coping strategies", () => {
    render(<UrgeResistance />)

    expect(screen.getByText("The 5-4-3-2-1 Grounding Technique")).toBeInTheDocument()
    expect(screen.getByText("Deep Breathing Exercise")).toBeInTheDocument()
  })

  it("navigates to strategy details when clicked", () => {
    render(<UrgeResistance />)

    const strategyButton = screen.getByText("The 5-4-3-2-1 Grounding Technique")
    fireEvent.click(strategyButton)

    expect(screen.getByText("Back")).toBeInTheDocument()
  })

  it("tracks completed steps", () => {
    render(<UrgeResistance />)

    const strategyButton = screen.getByText("The 5-4-3-2-1 Grounding Technique")
    fireEvent.click(strategyButton)

    const steps = screen.getAllByRole("button")
    const firstStep = steps.find((btn) => btn.textContent?.includes("5 things you can see"))

    if (firstStep) {
      fireEvent.click(firstStep)
      expect(firstStep.querySelector(".line-through")).toBeInTheDocument()
    }
  })

  it("shows completion message when all steps are done", () => {
    render(<UrgeResistance />)

    const strategyButton = screen.getByText("The 5-4-3-2-1 Grounding Technique")
    fireEvent.click(strategyButton)

    const stepButtons = screen.getAllByRole("button").filter((btn) => !btn.textContent?.includes("Back"))

    stepButtons.forEach((btn) => fireEvent.click(btn))

    expect(screen.getByText(/Great job!/i)).toBeInTheDocument()
  })
})
