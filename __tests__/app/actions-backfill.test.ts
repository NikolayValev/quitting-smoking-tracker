import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/db", () => ({
  db: { insert: vi.fn(), update: vi.fn() },
}))

vi.mock("@/db/schema", () => ({
  smokeLogs: { id: "id", userId: "user_id", ts: "ts", logDate: "log_date", cigarettes: "cigarettes", note: "note" },
}))

vi.mock("@/lib/auth/getOrCreateUser", () => ({ getOrCreateUser: vi.fn() }))
vi.mock("@/lib/rate-limit", () => ({ consumeRateLimit: vi.fn() }))
vi.mock("@/lib/observability/logger", () => ({ logError: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

const USER_ID = "11111111-1111-4111-8111-111111111111"
const LOG_ID = "22222222-2222-4222-8222-222222222222"

async function signedIn() {
  const { getOrCreateUser } = await import("@/lib/auth/getOrCreateUser")
  const { consumeRateLimit } = await import("@/lib/rate-limit")
  vi.mocked(getOrCreateUser).mockResolvedValue(USER_ID)
  vi.mocked(consumeRateLimit).mockResolvedValue({
    allowed: true,
    used: 1,
    limit: 30,
    resetAt: new Date(),
  })
}

/** Captures what an insert would write, and the conflict clause it would use. */
function captureInsert() {
  const onConflictDoUpdate = vi.fn().mockReturnValue({
    returning: () => Promise.resolve([{ id: LOG_ID }]),
  })
  const values = vi.fn().mockReturnValue({ onConflictDoUpdate })
  return { values, onConflictDoUpdate, chain: { values } }
}

describe("createLog, backfilling a day", () => {
  beforeEach(() => vi.clearAllMocks())

  it("records the day the check-in is about, not the day it was typed", async () => {
    await signedIn()
    const { db } = await import("@/db")
    const { values } = captureInsert()
    vi.mocked(db.insert).mockReturnValue({ values } as never)

    const { createLog } = await import("@/app/app/actions")
    await createLog({ cigarettes: 3, date: "2025-02-14" })

    const written = values.mock.calls[0][0]
    expect(written.logDate).toBe("2025-02-14")
    expect(written.ts.toISOString()).toBe("2025-02-14T12:00:00.000Z")
  })

  it("places the timestamp at midday so the date survives any time zone", async () => {
    // A midnight timestamp lands on the previous day for anyone west of UTC.
    await signedIn()
    const { db } = await import("@/db")
    const { values } = captureInsert()
    vi.mocked(db.insert).mockReturnValue({ values } as never)

    const { createLog } = await import("@/app/app/actions")
    await createLog({ cigarettes: 0, date: "2025-06-01" })

    const { ts } = values.mock.calls[0][0]
    expect(ts.getUTCHours()).toBe(12)
  })

  it("replaces a day already logged instead of adding a second entry", async () => {
    // Without this, backfilling a day you had already recorded silently doubles
    // it in the chart and in every count derived from it.
    await signedIn()
    const { db } = await import("@/db")
    const { values, onConflictDoUpdate } = captureInsert()
    vi.mocked(db.insert).mockReturnValue({ values } as never)

    const { createLog } = await import("@/app/app/actions")
    await createLog({ cigarettes: 7, note: "corrected", date: "2025-02-14" })

    expect(onConflictDoUpdate).toHaveBeenCalledTimes(1)
    const clause = onConflictDoUpdate.mock.calls[0][0]
    expect(clause.set.cigarettes).toBe(7)
    expect(clause.set.note).toBe("corrected")
  })

  it("refuses a date that is not a date", async () => {
    await signedIn()
    const { db } = await import("@/db")

    const { createLog } = await import("@/app/app/actions")
    const result = await createLog({ cigarettes: 1, date: "last tuesday" })

    expect(result.success).toBe(false)
    expect(db.insert).not.toHaveBeenCalled()
  })

  it("falls back to today when no day is given", async () => {
    await signedIn()
    const { db } = await import("@/db")
    const { values } = captureInsert()
    vi.mocked(db.insert).mockReturnValue({ values } as never)

    const { createLog } = await import("@/app/app/actions")
    await createLog({ cigarettes: 2 })

    expect(values.mock.calls[0][0].logDate).toBe(new Date().toISOString().slice(0, 10))
  })
})

describe("updateLog", () => {
  beforeEach(() => vi.clearAllMocks())

  it("corrects a count someone got wrong", async () => {
    await signedIn()
    const { db } = await import("@/db")
    const where = vi.fn().mockReturnValue({ returning: () => Promise.resolve([{ id: LOG_ID }]) })
    vi.mocked(db.update).mockReturnValue({ set: () => ({ where }) } as never)

    const { updateLog } = await import("@/app/app/actions")
    const result = await updateLog({ id: LOG_ID, cigarettes: 4 })

    expect(result.success).toBe(true)
  })

  it("will not touch a row belonging to someone else", async () => {
    // Ownership is in the where clause, so a mismatch updates nothing rather
    // than relying on a separate read that could be raced.
    await signedIn()
    const { db } = await import("@/db")
    const where = vi.fn().mockReturnValue({ returning: () => Promise.resolve([]) })
    vi.mocked(db.update).mockReturnValue({ set: () => ({ where }) } as never)

    const { updateLog } = await import("@/app/app/actions")
    const result = await updateLog({ id: LOG_ID, cigarettes: 4 })

    expect(result.success).toBe(false)
    expect(result.error).toMatch(/not found or unauthorized/i)
  })

  it("is refused once the write budget is spent", async () => {
    const { getOrCreateUser } = await import("@/lib/auth/getOrCreateUser")
    const { consumeRateLimit } = await import("@/lib/rate-limit")
    const { db } = await import("@/db")
    vi.mocked(getOrCreateUser).mockResolvedValue(USER_ID)
    vi.mocked(consumeRateLimit).mockResolvedValue({
      allowed: false,
      used: 31,
      limit: 30,
      resetAt: new Date(),
    })

    const { updateLog } = await import("@/app/app/actions")
    const result = await updateLog({ id: LOG_ID, cigarettes: 4 })

    expect(result.success).toBe(false)
    expect(db.update).not.toHaveBeenCalled()
  })
})
