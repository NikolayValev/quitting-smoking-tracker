import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/db", () => ({
  db: {
    select: vi.fn(),
  },
}))

const CLERK_USER_ID = "user_123"
const INTERNAL_USER_ID = "11111111-1111-4111-8111-111111111111"
const LOG_ID = "22222222-2222-4222-8222-222222222222"

const PROFILE = {
  email: "someone@example.com",
  firstName: "Sam",
  lastName: "Rivera",
}

/** Queues the account lookup, then the smoke-log lookup, in call order. */
async function mockQueries(accountRows: unknown[], logRows: unknown[]) {
  const { db } = await import("@/db")

  vi.mocked(db.select)
    .mockReturnValueOnce({
      from: () => ({ where: () => ({ limit: () => Promise.resolve(accountRows) }) }),
    } as never)
    .mockReturnValueOnce({
      from: () => ({ where: () => ({ orderBy: () => Promise.resolve(logRows) }) }),
    } as never)
}

describe("exportUserData", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("includes the account, the Clerk profile, and every smoke log", async () => {
    const createdAt = new Date("2026-01-02T03:04:05.000Z")
    const ts = new Date("2026-02-03T04:05:06.000Z")
    await mockQueries(
      [{ id: INTERNAL_USER_ID, createdAt }],
      [{ id: LOG_ID, ts, cigarettes: 3, note: "after lunch" }],
    )

    const { exportUserData } = await import("@/lib/account/exportUserData")
    const result = await exportUserData(CLERK_USER_ID, PROFILE)

    expect(result.account).toEqual({
      id: INTERNAL_USER_ID,
      clerkUserId: CLERK_USER_ID,
      createdAt: createdAt.toISOString(),
      email: PROFILE.email,
      firstName: PROFILE.firstName,
      lastName: PROFILE.lastName,
    })
    expect(result.smokeLogs).toEqual([
      { id: LOG_ID, ts: ts.toISOString(), cigarettes: 3, note: "after lunch" },
    ])
    expect(result.counts).toEqual({ smokeLogs: 1 })
  })

  it("is self-describing so the file makes sense away from the app", async () => {
    await mockQueries([{ id: INTERNAL_USER_ID, createdAt: new Date() }], [])

    const { exportUserData, EXPORT_FORMAT_VERSION } = await import("@/lib/account/exportUserData")
    const result = await exportUserData(CLERK_USER_ID, PROFILE)

    expect(result.format).toBe(EXPORT_FORMAT_VERSION)
    expect(Date.parse(result.exportedAt)).not.toBeNaN()
  })

  it("still returns the Clerk profile when the user has no local rows yet", async () => {
    // Signing in does not create a user row; it is written on first log. Such a
    // user still has personal data with us, so the export must not 404 on them.
    const { db } = await import("@/db")
    vi.mocked(db.select).mockReturnValueOnce({
      from: () => ({ where: () => ({ limit: () => Promise.resolve([]) }) }),
    } as never)

    const { exportUserData } = await import("@/lib/account/exportUserData")
    const result = await exportUserData(CLERK_USER_ID, PROFILE)

    expect(result.account.id).toBeNull()
    expect(result.account.createdAt).toBeNull()
    expect(result.account.email).toBe(PROFILE.email)
    expect(result.smokeLogs).toEqual([])
    expect(result.counts).toEqual({ smokeLogs: 0 })
  })

  it("does not query for logs when there is no local account", async () => {
    const { db } = await import("@/db")
    vi.mocked(db.select).mockReturnValueOnce({
      from: () => ({ where: () => ({ limit: () => Promise.resolve([]) }) }),
    } as never)

    const { exportUserData } = await import("@/lib/account/exportUserData")
    await exportUserData(CLERK_USER_ID, PROFILE)

    expect(db.select).toHaveBeenCalledTimes(1)
  })
})
