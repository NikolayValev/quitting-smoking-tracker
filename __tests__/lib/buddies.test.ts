import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/db", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  },
}))

const OWNER = "11111111-1111-4111-8111-111111111111"
const BUDDY = "22222222-2222-4222-8222-222222222222"
const NOW = new Date("2025-03-01T12:00:00.000Z")
const DAY = 86_400_000

function link(overrides: Record<string, unknown> = {}) {
  return {
    id: "link-1",
    ownerUserId: OWNER,
    buddyUserId: BUDDY,
    codeHash: "hash",
    createdAt: new Date(NOW.getTime() - DAY),
    expiresAt: new Date(NOW.getTime() + 6 * DAY),
    acceptedAt: new Date(NOW.getTime() - DAY),
    revokedAt: null,
    ...overrides,
  }
}

describe("linkState", () => {
  it("accepts a live, accepted, unrevoked link", async () => {
    const { linkState } = await import("@/lib/buddies")
    expect(linkState(link(), NOW)).toBe("active")
  })

  it("rejects a revoked link even though it was once accepted", async () => {
    const { linkState } = await import("@/lib/buddies")
    expect(linkState(link({ revokedAt: new Date(NOW.getTime() - 1000) }), NOW)).toBe("revoked")
  })

  it("treats an unaccepted invite as pending, not usable", async () => {
    const { linkState } = await import("@/lib/buddies")
    expect(linkState(link({ acceptedAt: null, buddyUserId: null }), NOW)).toBe("pending")
  })

  it("expires an invite nobody accepted in time", async () => {
    const { linkState } = await import("@/lib/buddies")
    const stale = link({ acceptedAt: null, buddyUserId: null, expiresAt: new Date(NOW.getTime() - 1) })
    expect(linkState(stale, NOW)).toBe("expired")
  })

  it("does not expire a link that was accepted before the deadline", async () => {
    // The window is for accepting the invite, not for how long a buddy may
    // watch. Expiring an accepted share would silently cut people off.
    const { linkState } = await import("@/lib/buddies")
    expect(linkState(link({ expiresAt: new Date(NOW.getTime() - DAY) }), NOW)).toBe("active")
  })
})

describe("toSharedSummary", () => {
  it("carries the streak and the milestone count", async () => {
    const { toSharedSummary } = await import("@/lib/buddies")
    const logs = Array.from({ length: 10 }, (_, i) => ({
      id: `l-${i}`,
      ts: new Date(NOW.getTime() - i * DAY),
      cigarettes: 0,
    }))

    const summary = toSharedSummary(logs, NOW)

    expect(summary.smokeFreeDays).toBe(9)
    expect(summary.milestonesReached).toBeGreaterThan(0)
    expect(summary.quitDate).not.toBeNull()
  })

  it("exposes nothing but the agreed fields", async () => {
    // This is the whole safety design: a buddy was promised the streak and the
    // milestones, not the diary. Asserting on the key set means a future
    // careless spread of the log row fails here instead of shipping.
    const { toSharedSummary } = await import("@/lib/buddies")
    const logs = [
      { id: "l-1", ts: NOW, cigarettes: 0, note: "the worst day of my life" },
      { id: "l-2", ts: new Date(NOW.getTime() - DAY), cigarettes: 12, note: "relapsed" },
    ]

    const summary = toSharedSummary(logs, NOW)

    expect(Object.keys(summary).sort()).toEqual([
      "milestoneCount",
      "milestonesReached",
      "quitDate",
      "smokeFreeDays",
    ])
    expect(JSON.stringify(summary)).not.toContain("worst day")
    expect(JSON.stringify(summary)).not.toContain("relapsed")
  })

  it("reports no streak for someone who has not stopped", async () => {
    const { toSharedSummary } = await import("@/lib/buddies")
    const summary = toSharedSummary([{ id: "l", ts: NOW, cigarettes: 4 }], NOW)

    expect(summary.smokeFreeDays).toBe(0)
    expect(summary.quitDate).toBeNull()
  })
})

describe("createInvite", () => {
  beforeEach(() => vi.clearAllMocks())

  it("stores only a hash of the code it hands back", async () => {
    const { db } = await import("@/db")
    const values = vi.fn().mockResolvedValue(undefined)
    vi.mocked(db.insert).mockReturnValue({ values } as never)

    const { createInvite } = await import("@/lib/buddies")
    const { code } = await createInvite(OWNER, NOW)

    const stored = values.mock.calls[0][0]
    expect(code).toBeTruthy()
    expect(stored.codeHash).not.toBe(code)
    expect(stored.codeHash).toMatch(/^[0-9a-f]{64}$/)
    expect(JSON.stringify(stored)).not.toContain(code)
  })

  it("issues a different code every time", async () => {
    const { db } = await import("@/db")
    vi.mocked(db.insert).mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) } as never)

    const { createInvite } = await import("@/lib/buddies")
    const a = await createInvite(OWNER, NOW)
    const b = await createInvite(OWNER, NOW)

    expect(a.code).not.toBe(b.code)
  })

  it("dates the invite so it cannot be accepted forever", async () => {
    const { db } = await import("@/db")
    const values = vi.fn().mockResolvedValue(undefined)
    vi.mocked(db.insert).mockReturnValue({ values } as never)

    const { createInvite, INVITE_TTL_DAYS } = await import("@/lib/buddies")
    await createInvite(OWNER, NOW)

    const stored = values.mock.calls[0][0]
    expect(stored.expiresAt.getTime()).toBe(NOW.getTime() + INVITE_TTL_DAYS * DAY)
  })
})

describe("getSharedSummary", () => {
  beforeEach(() => vi.clearAllMocks())

  it("refuses a viewer with no link to that person", async () => {
    const { db } = await import("@/db")
    vi.mocked(db.select).mockReturnValue({
      from: () => ({ where: () => ({ limit: () => Promise.resolve([]) }) }),
    } as never)

    const { getSharedSummary } = await import("@/lib/buddies")
    expect(await getSharedSummary(OWNER, BUDDY, NOW)).toBeNull()
  })

  it("does not read the owner's logs at all when there is no link", async () => {
    // Order matters: check permission, then read. Reading first and filtering
    // after is how data ends up somewhere it should not be.
    const { db } = await import("@/db")
    vi.mocked(db.select).mockReturnValue({
      from: () => ({ where: () => ({ limit: () => Promise.resolve([]) }) }),
    } as never)

    const { getSharedSummary } = await import("@/lib/buddies")
    await getSharedSummary(OWNER, BUDDY, NOW)

    expect(db.select).toHaveBeenCalledTimes(1)
  })
})
