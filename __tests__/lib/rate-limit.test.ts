import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/db", () => ({ db: { execute: vi.fn() } }))
vi.mock("@/lib/observability/logger", () => ({ logError: vi.fn(), logWarn: vi.fn() }))

const SUBJECT = "user:11111111-1111-1111-1111-111111111111"

// The upsert returns the post-increment count and the window it belongs to.
function dbReturns(count: number, windowStart = new Date("2026-01-01T00:00:00Z")) {
  return [{ count, window_start: windowStart }]
}

describe("consumeRateLimit", () => {
  beforeEach(() => vi.clearAllMocks())

  it("allows a request that lands under the limit", async () => {
    const { db } = await import("@/db")
    vi.mocked(db.execute).mockResolvedValue(dbReturns(1) as never)

    const { consumeRateLimit } = await import("@/lib/rate-limit")
    const result = await consumeRateLimit(SUBJECT, { limit: 30, windowSeconds: 60 })

    expect(result.allowed).toBe(true)
    expect(result.used).toBe(1)
  })

  it("allows the request that exactly reaches the limit", async () => {
    const { db } = await import("@/db")
    vi.mocked(db.execute).mockResolvedValue(dbReturns(30) as never)

    const { consumeRateLimit } = await import("@/lib/rate-limit")
    const result = await consumeRateLimit(SUBJECT, { limit: 30, windowSeconds: 60 })

    expect(result.allowed).toBe(true)
  })

  it("rejects the request that goes past the limit", async () => {
    const { db } = await import("@/db")
    vi.mocked(db.execute).mockResolvedValue(dbReturns(31) as never)

    const { consumeRateLimit } = await import("@/lib/rate-limit")
    const result = await consumeRateLimit(SUBJECT, { limit: 30, windowSeconds: 60 })

    expect(result.allowed).toBe(false)
    expect(result.used).toBe(31)
  })

  it("reports when the window resets so callers can tell the user", async () => {
    const { db } = await import("@/db")
    const windowStart = new Date("2026-01-01T00:00:00Z")
    vi.mocked(db.execute).mockResolvedValue(dbReturns(31, windowStart) as never)

    const { consumeRateLimit } = await import("@/lib/rate-limit")
    const result = await consumeRateLimit(SUBJECT, { limit: 30, windowSeconds: 60 })

    expect(result.resetAt.toISOString()).toBe("2026-01-01T00:01:00.000Z")
  })

  it("fails open and logs when the limiter query itself errors", async () => {
    const { db } = await import("@/db")
    const { logError } = await import("@/lib/observability/logger")
    vi.mocked(db.execute).mockRejectedValue(new Error("connection reset"))

    const { consumeRateLimit } = await import("@/lib/rate-limit")
    const result = await consumeRateLimit(SUBJECT, { limit: 30, windowSeconds: 60 })

    // Blocking real usage because the limiter broke is the worse failure.
    expect(result.allowed).toBe(true)
    expect(vi.mocked(logError)).toHaveBeenCalledWith(
      "rate_limit_check_failed",
      expect.any(Error),
      expect.objectContaining({ subject: SUBJECT }),
    )
  })

  it("fails open if the database returns no row", async () => {
    const { db } = await import("@/db")
    vi.mocked(db.execute).mockResolvedValue([] as never)

    const { consumeRateLimit } = await import("@/lib/rate-limit")
    const result = await consumeRateLimit(SUBJECT, { limit: 30, windowSeconds: 60 })

    expect(result.allowed).toBe(true)
  })
})
