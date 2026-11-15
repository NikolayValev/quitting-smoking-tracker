import React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"

const push = vi.fn()

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}))

import { DeleteAccountButton } from "@/app/account/delete-account-button"

const RECEIPT = {
  id: "receipt-abc-123",
  deletedAt: "2026-09-13T12:00:00.000Z",
  smokeLogsErased: 12,
}

function mockDelete(body: unknown, ok = true) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok, json: () => Promise.resolve(body) }))
}

/** Opens the confirmation dialog and confirms. */
async function confirmDelete() {
  fireEvent.click(screen.getByRole("button", { name: /delete my data/i }))
  const confirm = await screen.findByRole("button", { name: /yes, delete my data/i })
  fireEvent.click(confirm)
}

describe("DeleteAccountButton", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.unstubAllGlobals()
  })

  it("shows the receipt instead of redirecting, so the only copy is not lost", async () => {
    mockDelete({ success: true, receipt: RECEIPT })

    render(<DeleteAccountButton />)
    await confirmDelete()

    expect(await screen.findByText(RECEIPT.id)).toBeTruthy()
    expect(screen.getByText("12")).toBeTruthy()
    expect(push).not.toHaveBeenCalled()
  })

  it("says the SmokeFree data went, not the sign-in", async () => {
    // The sign-in is shared with the other apps and survives this, so the
    // confirmation must not claim the account is gone.
    mockDelete({ success: true, receipt: RECEIPT })

    render(<DeleteAccountButton />)
    await confirmDelete()

    expect(await screen.findByText(/your smokefree data has been deleted/i)).toBeTruthy()
    expect(screen.queryByText(/account has been deleted/i)).toBeNull()
  })

  it("leaves for the home page only once the user is done with the receipt", async () => {
    mockDelete({ success: true, receipt: RECEIPT })

    render(<DeleteAccountButton />)
    await confirmDelete()

    fireEvent.click(await screen.findByRole("button", { name: /done/i }))
    expect(push).toHaveBeenCalledWith("/")
  })

  it("surfaces an error and lets the user try again when deletion fails", async () => {
    mockDelete({ error: "Failed to delete your data" }, false)

    render(<DeleteAccountButton />)
    await confirmDelete()

    expect(await screen.findByRole("alert")).toHaveTextContent(/failed to delete your data/i)
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /delete my data/i })).not.toBeDisabled(),
    )
    expect(push).not.toHaveBeenCalled()
  })
})
