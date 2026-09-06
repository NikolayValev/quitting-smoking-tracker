import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

vi.mock("@clerk/nextjs/webhooks", () => ({
  verifyWebhook: vi.fn(),
}))

vi.mock("@/lib/auth/deleteUserByClerkId", () => ({
  deleteUserByClerkId: vi.fn(),
}))

vi.mock("@/lib/observability/logger", () => ({
  logError: vi.fn(),
  logWarn: vi.fn(),
}))

const CLERK_USER_ID = "user_123"

function request() {
  return new NextRequest("https://example.com/api/webhooks/clerk", { method: "POST" })
}

describe("POST /api/webhooks/clerk", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("deletes the user's data when a user.deleted event arrives", async () => {
    const { verifyWebhook } = await import("@clerk/nextjs/webhooks")
    const { deleteUserByClerkId } = await import("@/lib/auth/deleteUserByClerkId")
    vi.mocked(verifyWebhook).mockResolvedValue({
      type: "user.deleted",
      data: { id: CLERK_USER_ID, deleted: true },
    } as never)
    vi.mocked(deleteUserByClerkId).mockResolvedValue({ deleted: true })

    const { POST } = await import("@/app/api/webhooks/clerk/route")
    const response = await POST(request())

    expect(deleteUserByClerkId).toHaveBeenCalledWith(CLERK_USER_ID)
    expect(response.status).toBe(200)
  })

  it("rejects a request whose signature does not verify", async () => {
    const { verifyWebhook } = await import("@clerk/nextjs/webhooks")
    const { deleteUserByClerkId } = await import("@/lib/auth/deleteUserByClerkId")
    vi.mocked(verifyWebhook).mockRejectedValue(new Error("signature mismatch"))

    const { POST } = await import("@/app/api/webhooks/clerk/route")
    const response = await POST(request())

    expect(response.status).toBe(400)
    expect(deleteUserByClerkId).not.toHaveBeenCalled()
  })

  it("ignores event types other than user.deleted", async () => {
    const { verifyWebhook } = await import("@clerk/nextjs/webhooks")
    const { deleteUserByClerkId } = await import("@/lib/auth/deleteUserByClerkId")
    vi.mocked(verifyWebhook).mockResolvedValue({
      type: "user.created",
      data: { id: CLERK_USER_ID },
    } as never)

    const { POST } = await import("@/app/api/webhooks/clerk/route")
    const response = await POST(request())

    expect(response.status).toBe(200)
    expect(deleteUserByClerkId).not.toHaveBeenCalled()
  })

  it("acknowledges a user.deleted event for a user that has no rows", async () => {
    const { verifyWebhook } = await import("@clerk/nextjs/webhooks")
    const { deleteUserByClerkId } = await import("@/lib/auth/deleteUserByClerkId")
    vi.mocked(verifyWebhook).mockResolvedValue({
      type: "user.deleted",
      data: { id: "user_never_logged_in", deleted: true },
    } as never)
    vi.mocked(deleteUserByClerkId).mockResolvedValue({ deleted: false })

    const { POST } = await import("@/app/api/webhooks/clerk/route")
    const response = await POST(request())

    expect(response.status).toBe(200)
  })

  it("returns 400 without touching the database when user.deleted carries no id", async () => {
    const { verifyWebhook } = await import("@clerk/nextjs/webhooks")
    const { deleteUserByClerkId } = await import("@/lib/auth/deleteUserByClerkId")
    const { logWarn } = await import("@/lib/observability/logger")
    vi.mocked(verifyWebhook).mockResolvedValue({
      type: "user.deleted",
      data: { deleted: true },
    } as never)

    const { POST } = await import("@/app/api/webhooks/clerk/route")
    const response = await POST(request())

    expect(response.status).toBe(400)
    expect(deleteUserByClerkId).not.toHaveBeenCalled()
    expect(logWarn).toHaveBeenCalledWith("clerk_webhook_user_deleted_missing_id")
  })

  it("returns 500 and logs when the deletion fails, so Clerk retries", async () => {
    const { verifyWebhook } = await import("@clerk/nextjs/webhooks")
    const { deleteUserByClerkId } = await import("@/lib/auth/deleteUserByClerkId")
    const { logError } = await import("@/lib/observability/logger")
    vi.mocked(verifyWebhook).mockResolvedValue({
      type: "user.deleted",
      data: { id: CLERK_USER_ID, deleted: true },
    } as never)
    vi.mocked(deleteUserByClerkId).mockRejectedValue(new Error("connection reset"))

    const { POST } = await import("@/app/api/webhooks/clerk/route")
    const response = await POST(request())

    expect(response.status).toBe(500)
    expect(logError).toHaveBeenCalledWith(
      "clerk_webhook_user_deleted_failed",
      expect.any(Error),
      { clerkUserId: CLERK_USER_ID },
    )
  })
})
