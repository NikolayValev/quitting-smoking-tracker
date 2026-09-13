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
  accountErased: true,
  smokeLogsErased: 12,
  complete: true,
}

function mockDelete(body: unknown, ok = true) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok, json: () => Promise.resolve(body) }))
}

/** Opens the confirmation dialog and confirms. */
async function confirmDelete() {
  fireEvent.click(screen.getByRole("button", { name: /delete account/i }))
  const confirm = await screen.findByRole("button", { name: /yes, delete my account/i })
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

  it("leaves for the home page only once the user is done with the receipt", async () => {
    mockDelete({ success: true, receipt: RECEIPT })

    render(<DeleteAccountButton />)
    await confirmDelete()

    fireEvent.click(await screen.findByRole("button", { name: /done/i }))
    expect(push).toHaveBeenCalledWith("/")
  })

  it("says erasure is still finishing when local cleanup did not complete", async () => {
    mockDelete({
      success: true,
      receipt: { ...RECEIPT, smokeLogsErased: null, complete: false },
    })

    render(<DeleteAccountButton />)
    await confirmDelete()

    expect(await screen.findByText(/still being erased/i)).toBeTruthy()
    // No count is known, so none is claimed.
    expect(screen.queryByText(/logs erased/i)).toBeNull()
  })

  it("surfaces an error and keeps the account intact when deletion fails", async () => {
    mockDelete({ error: "Failed to delete account" }, false)

    render(<DeleteAccountButton />)
    await confirmDelete()

    expect(await screen.findByRole("alert")).toHaveTextContent(/failed to delete account/i)
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /delete account/i })).not.toBeDisabled(),
    )
    expect(push).not.toHaveBeenCalled()
  })
})
