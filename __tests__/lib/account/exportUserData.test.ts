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

/** Queues the account, smoke-log, share and signal lookups, in call order. */
async function mockQueries(
  accountRows: unknown[],
  logRows: unknown[],
  shareRows: unknown[] = [],
  signalRows: unknown[] = [],
  deviceRows: unknown[] = [],
) {
  const { db } = await import("@/db")

  const select = vi.mocked(db.select)
  select
    .mockReturnValueOnce({
      from: () => ({ where: () => ({ limit: () => Promise.resolve(accountRows) }) }),
    } as never)
    .mockReturnValueOnce({
      from: () => ({ where: () => ({ orderBy: () => Promise.resolve(logRows) }) }),
    } as never)
    .mockReturnValueOnce({
      from: () => ({ where: () => Promise.resolve(shareRows) }),
    } as never)

  // Signals are only looked up when there are shares to hang off; queueing the
  // mock otherwise would leave it to be served to the next test.
  if (shareRows.length > 0) {
    select.mockReturnValueOnce({
      from: () => ({ where: () => ({ orderBy: () => Promise.resolve(signalRows) }) }),
    } as never)
  }

  // Devices are only looked up for someone with an account row.
  if (accountRows.length > 0) {
    select.mockReturnValueOnce({
      from: () => ({ where: () => Promise.resolve(deviceRows) }),
    } as never)
  }
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
    expect(result.counts).toEqual({ smokeLogs: 1, shares: 0, signals: 0, devices: 0 })
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
    expect(result.shares).toEqual([])
    expect(result.counts).toEqual({ smokeLogs: 0, shares: 0, signals: 0, devices: 0 })
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

  it("exports each share's relationship and the signals, without the other party", async () => {
    const OTHER = "33333333-3333-4333-8333-333333333333"
    const at = new Date("2026-03-01T10:00:00.000Z")
    await mockQueries(
      [{ id: INTERNAL_USER_ID, createdAt: at }],
      [],
      [
        {
          id: "link-1",
          ownerUserId: INTERNAL_USER_ID,
          buddyUserId: OTHER,
          role: "sponsor",
          createdAt: at,
          acceptedAt: at,
          revokedAt: null,
        },
      ],
      [
        { fromUserId: INTERNAL_USER_ID, kind: "sos", createdAt: at },
        { fromUserId: OTHER, kind: "proud", createdAt: at },
      ],
    )

    const { exportUserData } = await import("@/lib/account/exportUserData")
    const result = await exportUserData(CLERK_USER_ID, PROFILE)

    expect(result.shares[0]).toMatchObject({ role: "owner", relationship: "sponsor" })
    expect(result.signals).toEqual([
      { direction: "sent", kind: "sos", createdAt: at.toISOString() },
      { direction: "received", kind: "proud", createdAt: at.toISOString() },
    ])
    expect(result.counts.signals).toBe(2)
    expect(JSON.stringify(result)).not.toContain(OTHER)
  })

  it("lists push devices by date and never their keys", async () => {
    const at = new Date("2026-03-01T10:00:00.000Z")
    await mockQueries(
      [{ id: INTERNAL_USER_ID, createdAt: at }],
      [],
      [],
      [],
      [{ createdAt: at }],
    )

    const { exportUserData } = await import("@/lib/account/exportUserData")
    const result = await exportUserData(CLERK_USER_ID, PROFILE)

    expect(result.devices).toEqual([{ addedAt: at.toISOString() }])
    expect(result.counts.devices).toBe(1)
  })
})
