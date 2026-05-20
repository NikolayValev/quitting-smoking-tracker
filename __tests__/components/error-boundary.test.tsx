import React from "react"
import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { ErrorBoundary } from "@/components/error-boundary"

function Bomb(): React.ReactElement {
  throw new Error("Boom!")
}

describe("ErrorBoundary", () => {
  it("renders children when there is no error", () => {
    render(
      <ErrorBoundary>
        <p>All good</p>
      </ErrorBoundary>,
    )
    expect(screen.getByText("All good")).toBeTruthy()
  })

  it("shows fallback UI when a child throws", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {})

    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    )

    expect(screen.getByText("Something went wrong.")).toBeTruthy()
    spy.mockRestore()
  })

  it("renders custom fallback when provided", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {})

    render(
      <ErrorBoundary fallback={<p>Custom error</p>}>
        <Bomb />
      </ErrorBoundary>,
    )

    expect(screen.getByText("Custom error")).toBeTruthy()
    spy.mockRestore()
  })

  it("resets error state when try again is clicked", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {})

    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    )

    const button = screen.getByRole("button", { name: /try again/i })
    fireEvent.click(button)

    spy.mockRestore()
  })
})
