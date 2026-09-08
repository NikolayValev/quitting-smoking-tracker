import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/db", () => ({
  db: { select: vi.fn(), insert: vi.fn(), delete: vi.fn(), execute: vi.fn() },
}))
vi.mock("@/lib/auth/getOrCreateUser", () => ({ getOrCreateUser: vi.fn() }))
vi.mock("@/lib/observability/logger", () => ({ logError: vi.fn(), logWarn: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/lib/rate-limit", () => ({ consumeRateLimit: vi.fn() }))

const USER_ID = "11111111-1111-1111-1111-111111111111"
const LOG_ID = "22222222-2222-2222-2222-222222222222"

function limited(allowed: boolean) {
  return { allowed, used: allowed ? 1 : 31, limit: 30, resetAt: new Date() }
}

describe("server actions are rate limited", () => {
  beforeEach(() => vi.clearAllMocks())

  it("refuses createLog once the budget is spent", async () => {
    const { getOrCreateUser } = await import("@/lib/auth/getOrCreateUser")
    const { consumeRateLimit } = await import("@/lib/rate-limit")
    const { db } = await import("@/db")
    vi.mocked(getOrCreateUser).mockResolvedValue(USER_ID)
    vi.mocked(consumeRateLimit).mockResolvedValue(limited(false))

    const { createLog } = await import("@/app/app/actions")
    const result = await createLog({ cigarettes: 1 })

    expect(result.success).toBe(false)
    // The point of the limit is that the write never happens.
    expect(db.insert).not.toHaveBeenCalled()
  })

  it("refuses deleteLog once the budget is spent", async () => {
    const { getOrCreateUser } = await import("@/lib/auth/getOrCreateUser")
    const { consumeRateLimit } = await import("@/lib/rate-limit")
    const { db } = await import("@/db")
    vi.mocked(getOrCreateUser).mockResolvedValue(USER_ID)
    vi.mocked(consumeRateLimit).mockResolvedValue(limited(false))

    const { deleteLog } = await import("@/app/app/actions")
    const result = await deleteLog({ id: LOG_ID })

    expect(result.success).toBe(false)
    expect(db.delete).not.toHaveBeenCalled()
  })

  it("lets createLog through while under the budget", async () => {
    const { getOrCreateUser } = await import("@/lib/auth/getOrCreateUser")
    const { consumeRateLimit } = await import("@/lib/rate-limit")
    const { db } = await import("@/db")
    vi.mocked(getOrCreateUser).mockResolvedValue(USER_ID)
    vi.mocked(consumeRateLimit).mockResolvedValue(limited(true))

    const row = { id: LOG_ID, userId: USER_ID, cigarettes: 1, note: null, ts: new Date() }
    vi.mocked(db.insert).mockReturnValue({
      values: () => ({ returning: () => Promise.resolve([row]) }),
    } as never)

    const { createLog } = await import("@/app/app/actions")
    const result = await createLog({ cigarettes: 1 })

    expect(result.success).toBe(true)
  })

  it("charges the limit against the signed-in user, not a shared bucket", async () => {
    const { getOrCreateUser } = await import("@/lib/auth/getOrCreateUser")
    const { consumeRateLimit } = await import("@/lib/rate-limit")
    const { db } = await import("@/db")
    vi.mocked(getOrCreateUser).mockResolvedValue(USER_ID)
    vi.mocked(consumeRateLimit).mockResolvedValue(limited(true))
    vi.mocked(db.insert).mockReturnValue({
      values: () => ({ returning: () => Promise.resolve([{}]) }),
    } as never)

    const { createLog } = await import("@/app/app/actions")
    await createLog({ cigarettes: 1 })

    expect(vi.mocked(consumeRateLimit)).toHaveBeenCalledWith(`user:${USER_ID}`)
  })

  it("does not spend budget on reads", async () => {
    const { getOrCreateUser } = await import("@/lib/auth/getOrCreateUser")
    const { consumeRateLimit } = await import("@/lib/rate-limit")
    const { db } = await import("@/db")
    vi.mocked(getOrCreateUser).mockResolvedValue(USER_ID)
    vi.mocked(db.select).mockReturnValue({
      from: () => ({ where: () => ({ orderBy: () => Promise.resolve([]) }) }),
    } as never)

    const { getLogs } = await import("@/app/app/actions")
    await getLogs()

    expect(vi.mocked(consumeRateLimit)).not.toHaveBeenCalled()
  })
})
