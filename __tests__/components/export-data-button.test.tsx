import React from "react"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { ExportDataButton } from "@/app/account/export-data-button"

const EXPORT_BODY = JSON.stringify({ format: 1, smokeLogs: [] })

function mockFetchOk(headers: Record<string, string> = {}) {
  const blob = new Blob([EXPORT_BODY], { type: "application/json" })
  return vi.fn().mockResolvedValue({
    ok: true,
    blob: () => Promise.resolve(blob),
    headers: { get: (name: string) => headers[name.toLowerCase()] ?? null },
  })
}

describe("ExportDataButton", () => {
  let click: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn(() => "blob:fake"),
      revokeObjectURL: vi.fn(),
    })
    // jsdom does not implement navigation, so a real click would warn.
    click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {})
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    click.mockRestore()
  })

  it("downloads the export using the filename the server chose", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetchOk({ "content-disposition": 'attachment; filename="export-2026-09-13.json"' }),
    )

    render(<ExportDataButton />)
    fireEvent.click(screen.getByRole("button", { name: /download my data/i }))

    await waitFor(() => expect(click).toHaveBeenCalled())
    const anchor = click.mock.instances[0] as HTMLAnchorElement
    expect(anchor.download).toBe("export-2026-09-13.json")
  })

  it("falls back to a sensible filename when the server sends no header", async () => {
    vi.stubGlobal("fetch", mockFetchOk())

    render(<ExportDataButton />)
    fireEvent.click(screen.getByRole("button", { name: /download my data/i }))

    await waitFor(() => expect(click).toHaveBeenCalled())
    const anchor = click.mock.instances[0] as HTMLAnchorElement
    expect(anchor.download).toBe("quit-smoking-tracker-export.json")
  })

  it("shows the server's message instead of navigating away on an error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: "Too many export requests. Please try again later." }),
      }),
    )

    render(<ExportDataButton />)
    fireEvent.click(screen.getByRole("button", { name: /download my data/i }))

    expect(await screen.findByRole("alert")).toHaveTextContent(/too many export requests/i)
    expect(click).not.toHaveBeenCalled()
  })

  it("recovers its label after a failed export so the user can retry", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")))

    render(<ExportDataButton />)
    fireEvent.click(screen.getByRole("button", { name: /download my data/i }))

    expect(await screen.findByRole("alert")).toBeTruthy()
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /download my data/i })).not.toBeDisabled(),
    )
  })
})
