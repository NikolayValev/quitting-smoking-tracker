import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
  clerkClient: vi.fn(),
}))

vi.mock("@/lib/observability/logger", () => ({
  logError: vi.fn(),
}))

vi.mock("@/lib/auth/deleteUserByClerkId", () => ({
  deleteUserByClerkId: vi.fn(),
}))

const CLERK_USER_ID = "user_123"

async function signedInAs(userId: string | null) {
  const { auth } = await import("@clerk/nextjs/server")
  vi.mocked(auth).mockResolvedValue({ userId } as never)
}

describe("POST /api/account/delete", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 401 when there is no authenticated user", async () => {
    await signedInAs(null)

    const { POST } = await import("@/app/api/account/delete/route")
    const response = await POST()
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body).toEqual({ error: "Unauthorized" })
  })

  it("erases the user's rows here", async () => {
    const { deleteUserByClerkId } = await import("@/lib/auth/deleteUserByClerkId")
    await signedInAs(CLERK_USER_ID)
    vi.mocked(deleteUserByClerkId).mockResolvedValue({ deleted: true, smokeLogsErased: 0 })

    const { POST } = await import("@/app/api/account/delete/route")
    const response = await POST()
    const body = await response.json()

    expect(deleteUserByClerkId).toHaveBeenCalledWith(CLERK_USER_ID)
    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
  })

  it("leaves the shared Clerk sign-in alone", async () => {
    // One Clerk instance serves every app on nikolayvalev.com. Deleting the Clerk
    // user here would sign this person out of all of them for good, and leave
    // the other apps holding rows for an identity that no longer exists.
    const { clerkClient } = await import("@clerk/nextjs/server")
    const { deleteUserByClerkId } = await import("@/lib/auth/deleteUserByClerkId")
    await signedInAs(CLERK_USER_ID)
    vi.mocked(deleteUserByClerkId).mockResolvedValue({ deleted: true, smokeLogsErased: 4 })

    const { POST } = await import("@/app/api/account/delete/route")
    await POST()

    expect(clerkClient).not.toHaveBeenCalled()
  })

  it("returns 500 when the erasure fails, so the user can try again", async () => {
    // With the Clerk account kept there is no user.deleted webhook to finish
    // the job later, so a failure has to be reported rather than receipted.
    // The erasure is one transaction, so a failure leaves nothing half-done.
    const { deleteUserByClerkId } = await import("@/lib/auth/deleteUserByClerkId")
    const { logError } = await import("@/lib/observability/logger")
    await signedInAs(CLERK_USER_ID)
    vi.mocked(deleteUserByClerkId).mockRejectedValue(new Error("connection reset"))

    const { POST } = await import("@/app/api/account/delete/route")
    const response = await POST()
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body).toEqual({ error: "Failed to delete your data" })
    expect(body.receipt).toBeUndefined()
    expect(logError).toHaveBeenCalledWith("account_delete_failed", expect.any(Error), {
      clerkUserId: CLERK_USER_ID,
    })
  })

  it("issues a receipt the user can keep as proof of erasure", async () => {
    const { deleteUserByClerkId } = await import("@/lib/auth/deleteUserByClerkId")
    await signedInAs(CLERK_USER_ID)
    vi.mocked(deleteUserByClerkId).mockResolvedValue({ deleted: true, smokeLogsErased: 12 })

    const { POST } = await import("@/app/api/account/delete/route")
    const body = await (await POST()).json()

    expect(Object.keys(body.receipt).sort()).toEqual(["deletedAt", "id", "smokeLogsErased"])
    expect(body.receipt.id).toEqual(expect.any(String))
    expect(body.receipt.id.length).toBeGreaterThan(0)
    expect(Date.parse(body.receipt.deletedAt)).not.toBeNaN()
    expect(body.receipt.smokeLogsErased).toBe(12)
  })

  it("receipts a user who never wrote anything with zero logs erased", async () => {
    const { deleteUserByClerkId } = await import("@/lib/auth/deleteUserByClerkId")
    await signedInAs(CLERK_USER_ID)
    vi.mocked(deleteUserByClerkId).mockResolvedValue({ deleted: false, smokeLogsErased: 0 })

    const { POST } = await import("@/app/api/account/delete/route")
    const response = await POST()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.receipt.smokeLogsErased).toBe(0)
  })

  it("gives each deletion its own receipt id", async () => {
    const { deleteUserByClerkId } = await import("@/lib/auth/deleteUserByClerkId")
    await signedInAs(CLERK_USER_ID)
    vi.mocked(deleteUserByClerkId).mockResolvedValue({ deleted: true, smokeLogsErased: 1 })

    const { POST } = await import("@/app/api/account/delete/route")
    const first = await (await POST()).json()
    const second = await (await POST()).json()

    expect(first.receipt.id).not.toBe(second.receipt.id)
  })

  it("does not put the receipt's subject back in the response body", async () => {
    // The receipt proves an erasure happened; it should not restate the identity
    // that was just erased.
    const { deleteUserByClerkId } = await import("@/lib/auth/deleteUserByClerkId")
    await signedInAs(CLERK_USER_ID)
    vi.mocked(deleteUserByClerkId).mockResolvedValue({ deleted: true, smokeLogsErased: 3 })

    const { POST } = await import("@/app/api/account/delete/route")
    const body = await (await POST()).json()

    expect(JSON.stringify(body)).not.toContain(CLERK_USER_ID)
  })
})
