import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
  currentUser: vi.fn(),
}))

vi.mock("@/lib/observability/logger", () => ({
  logError: vi.fn(),
}))

vi.mock("@/lib/account/exportUserData", () => ({
  exportUserData: vi.fn(),
}))

vi.mock("@/lib/rate-limit", () => ({
  consumeRateLimit: vi.fn(),
}))

const CLERK_USER_ID = "user_123"

const EXPORT_PAYLOAD = {
  format: 1,
  exportedAt: "2026-09-13T00:00:00.000Z",
  account: {
    id: "11111111-1111-4111-8111-111111111111",
    clerkUserId: CLERK_USER_ID,
    createdAt: "2026-01-01T00:00:00.000Z",
    email: "someone@example.com",
    firstName: "Sam",
    lastName: "Rivera",
  },
  smokeLogs: [],
  counts: { smokeLogs: 0 },
}

/** Signs the caller in and lets the rate limiter through. */
async function signedIn() {
  const { auth, currentUser } = await import("@clerk/nextjs/server")
  const { consumeRateLimit } = await import("@/lib/rate-limit")
  vi.mocked(auth).mockResolvedValue({ userId: CLERK_USER_ID } as never)
  vi.mocked(currentUser).mockResolvedValue({
    emailAddresses: [{ emailAddress: "someone@example.com" }],
    firstName: "Sam",
    lastName: "Rivera",
  } as never)
  vi.mocked(consumeRateLimit).mockResolvedValue({
    allowed: true,
    used: 1,
    limit: 5,
    resetAt: new Date(),
  })
}

describe("GET /api/account/export", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 401 when there is no authenticated user", async () => {
    const { auth } = await import("@clerk/nextjs/server")
    vi.mocked(auth).mockResolvedValue({ userId: null } as never)

    const { GET } = await import("@/app/api/account/export/route")
    const response = await GET()

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ error: "Unauthorized" })
  })

  it("returns the caller's data as a downloadable JSON file", async () => {
    await signedIn()
    const { exportUserData } = await import("@/lib/account/exportUserData")
    vi.mocked(exportUserData).mockResolvedValue(EXPORT_PAYLOAD)

    const { GET } = await import("@/app/api/account/export/route")
    const response = await GET()

    expect(response.status).toBe(200)
    expect(response.headers.get("content-type")).toContain("application/json")
    expect(response.headers.get("content-disposition")).toContain("attachment")
    expect(await response.json()).toEqual(EXPORT_PAYLOAD)
  })

  it("passes the Clerk profile through to the export", async () => {
    await signedIn()
    const { exportUserData } = await import("@/lib/account/exportUserData")
    vi.mocked(exportUserData).mockResolvedValue(EXPORT_PAYLOAD)

    const { GET } = await import("@/app/api/account/export/route")
    await GET()

    expect(exportUserData).toHaveBeenCalledWith(CLERK_USER_ID, {
      email: "someone@example.com",
      firstName: "Sam",
      lastName: "Rivera",
    })
  })

  it("is never cached, so one user's export cannot be served to another", async () => {
    await signedIn()
    const { exportUserData } = await import("@/lib/account/exportUserData")
    vi.mocked(exportUserData).mockResolvedValue(EXPORT_PAYLOAD)

    const { GET } = await import("@/app/api/account/export/route")
    const response = await GET()

    expect(response.headers.get("cache-control")).toContain("no-store")
  })

  it("refuses the request once the export budget is spent", async () => {
    await signedIn()
    const { consumeRateLimit } = await import("@/lib/rate-limit")
    const { exportUserData } = await import("@/lib/account/exportUserData")
    vi.mocked(consumeRateLimit).mockResolvedValue({
      allowed: false,
      used: 6,
      limit: 5,
      resetAt: new Date(),
    })

    const { GET } = await import("@/app/api/account/export/route")
    const response = await GET()

    expect(response.status).toBe(429)
    expect(exportUserData).not.toHaveBeenCalled()
  })

  it("meters exports separately from the write budget", async () => {
    await signedIn()
    const { consumeRateLimit } = await import("@/lib/rate-limit")
    const { exportUserData } = await import("@/lib/account/exportUserData")
    vi.mocked(exportUserData).mockResolvedValue(EXPORT_PAYLOAD)

    const { GET } = await import("@/app/api/account/export/route")
    await GET()

    const subject = vi.mocked(consumeRateLimit).mock.calls[0][0]
    expect(subject).toContain(CLERK_USER_ID)
    expect(subject).not.toBe(`user:${CLERK_USER_ID}`)
  })

  it("returns 500 without leaking the underlying error", async () => {
    await signedIn()
    const { exportUserData } = await import("@/lib/account/exportUserData")
    const { logError } = await import("@/lib/observability/logger")
    vi.mocked(exportUserData).mockRejectedValue(new Error("connection refused to db-host"))

    const { GET } = await import("@/app/api/account/export/route")
    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(JSON.stringify(body)).not.toContain("db-host")
    expect(logError).toHaveBeenCalled()
  })
})
