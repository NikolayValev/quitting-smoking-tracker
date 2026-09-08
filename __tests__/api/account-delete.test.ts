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

describe("POST /api/account/delete", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 401 when there is no authenticated user", async () => {
    const { auth } = await import("@clerk/nextjs/server")
    vi.mocked(auth).mockResolvedValue({ userId: null } as never)

    const { POST } = await import("@/app/api/account/delete/route")
    const response = await POST()
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body).toEqual({ error: "Unauthorized" })
  })

  it("deletes the Clerk user and returns success", async () => {
    const { auth, clerkClient } = await import("@clerk/nextjs/server")
    const { deleteUserByClerkId } = await import("@/lib/auth/deleteUserByClerkId")
    vi.mocked(auth).mockResolvedValue({ userId: CLERK_USER_ID } as never)
    vi.mocked(deleteUserByClerkId).mockResolvedValue({ deleted: true })
    const deleteUser = vi.fn().mockResolvedValue(undefined)
    vi.mocked(clerkClient).mockResolvedValue({ users: { deleteUser } } as never)

    const { POST } = await import("@/app/api/account/delete/route")
    const response = await POST()
    const body = await response.json()

    expect(deleteUser).toHaveBeenCalledWith(CLERK_USER_ID)
    expect(response.status).toBe(200)
    expect(body).toEqual({ success: true })
  })

  it("erases the user's local rows so deletion does not wait on the webhook", async () => {
    const { auth, clerkClient } = await import("@clerk/nextjs/server")
    const { deleteUserByClerkId } = await import("@/lib/auth/deleteUserByClerkId")
    vi.mocked(auth).mockResolvedValue({ userId: CLERK_USER_ID } as never)
    vi.mocked(deleteUserByClerkId).mockResolvedValue({ deleted: true })
    vi.mocked(clerkClient).mockResolvedValue({
      users: { deleteUser: vi.fn().mockResolvedValue(undefined) },
    } as never)

    const { POST } = await import("@/app/api/account/delete/route")
    await POST()

    expect(deleteUserByClerkId).toHaveBeenCalledWith(CLERK_USER_ID)
  })

  it("still succeeds when local cleanup fails, leaving it to the webhook", async () => {
    const { auth, clerkClient } = await import("@clerk/nextjs/server")
    const { deleteUserByClerkId } = await import("@/lib/auth/deleteUserByClerkId")
    const { logError } = await import("@/lib/observability/logger")
    vi.mocked(auth).mockResolvedValue({ userId: CLERK_USER_ID } as never)
    vi.mocked(clerkClient).mockResolvedValue({
      users: { deleteUser: vi.fn().mockResolvedValue(undefined) },
    } as never)
    vi.mocked(deleteUserByClerkId).mockRejectedValue(new Error("connection reset"))

    const { POST } = await import("@/app/api/account/delete/route")
    const response = await POST()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({ success: true })
    expect(logError).toHaveBeenCalledWith("account_delete_local_cleanup_failed", expect.any(Error), {
      clerkUserId: CLERK_USER_ID,
    })
  })

  it("returns 500 and logs when Clerk deletion fails", async () => {
    const { auth, clerkClient } = await import("@clerk/nextjs/server")
    const { logError } = await import("@/lib/observability/logger")
    vi.mocked(auth).mockResolvedValue({ userId: CLERK_USER_ID } as never)
    vi.mocked(clerkClient).mockResolvedValue({
      users: { deleteUser: vi.fn().mockRejectedValue(new Error("clerk error")) },
    } as never)

    const { POST } = await import("@/app/api/account/delete/route")
    const response = await POST()
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body).toEqual({ error: "Failed to delete account" })
    expect(logError).toHaveBeenCalledWith("account_delete_failed", expect.any(Error), {
      clerkUserId: CLERK_USER_ID,
    })
  })
})
