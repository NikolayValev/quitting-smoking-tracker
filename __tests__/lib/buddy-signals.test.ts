import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/db", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
  },
}))

const OWNER = "11111111-1111-4111-8111-111111111111"
const BUDDY = "22222222-2222-4222-8222-222222222222"
const STRANGER = "33333333-3333-4333-8333-333333333333"
const NOW = new Date("2025-03-01T12:00:00.000Z")
const DAY = 86_400_000

function link(overrides: Record<string, unknown> = {}) {
  return {
    id: "link-1",
    ownerUserId: OWNER,
    buddyUserId: BUDDY,
    codeHash: "hash",
    role: "sponsor",
    createdAt: new Date(NOW.getTime() - DAY),
    expiresAt: new Date(NOW.getTime() + 6 * DAY),
    acceptedAt: new Date(NOW.getTime() - DAY),
    revokedAt: null,
    ...overrides,
  }
}

async function serveLink(rows: unknown[]) {
  const { db } = await import("@/db")
  vi.mocked(db.select).mockReturnValue({
    from: () => ({ where: () => ({ limit: () => Promise.resolve(rows) }) }),
  } as never)
}

async function captureInsert() {
  const { db } = await import("@/db")
  const values = vi.fn().mockResolvedValue(undefined)
  vi.mocked(db.insert).mockReturnValue({ values } as never)
  return values
}

describe("sendCheer", () => {
  beforeEach(() => vi.clearAllMocks())

  it("lets the supporter on a live link send one", async () => {
    await serveLink([link()])
    const values = await captureInsert()

    const { sendCheer } = await import("@/lib/buddy-signals")
    expect(await sendCheer("link-1", BUDDY, "proud", NOW)).toEqual({ sent: true, recipient: OWNER })
    expect(values.mock.calls[0][0]).toMatchObject({ linkId: "link-1", fromUserId: BUDDY, kind: "proud" })
  })

  it("refuses anyone who is not the supporter on that link", async () => {
    // A guessed link id must not be a way to put a message in front of a stranger.
    await serveLink([link()])
    const values = await captureInsert()

    const { sendCheer } = await import("@/lib/buddy-signals")
    expect(await sendCheer("link-1", STRANGER, "proud", NOW)).toEqual({ sent: false })
    expect(await sendCheer("link-1", OWNER, "proud", NOW)).toEqual({ sent: false })
    expect(values).not.toHaveBeenCalled()
  })

  it("refuses a revoked or unaccepted link", async () => {
    const values = await captureInsert()
    const { sendCheer } = await import("@/lib/buddy-signals")

    await serveLink([link({ revokedAt: NOW })])
    expect(await sendCheer("link-1", BUDDY, "proud", NOW)).toEqual({ sent: false })

    await serveLink([link({ acceptedAt: null })])
    expect(await sendCheer("link-1", BUDDY, "proud", NOW)).toEqual({ sent: false })

    expect(values).not.toHaveBeenCalled()
  })
})

describe("sendSos", () => {
  beforeEach(() => vi.clearAllMocks())

  async function serveSponsors(rows: unknown[]) {
    const { db } = await import("@/db")
    vi.mocked(db.select).mockReturnValue({
      from: () => ({ where: () => Promise.resolve(rows) }),
    } as never)
  }

  it("goes to every active sponsor at once", async () => {
    await serveSponsors([
      { id: "a", buddyUserId: "sponsor-a" },
      { id: "b", buddyUserId: "sponsor-b" },
    ])
    const values = await captureInsert()

    const { sendSos } = await import("@/lib/buddy-signals")
    expect(await sendSos(OWNER, NOW)).toEqual({ sent: 2, recipients: ["sponsor-a", "sponsor-b"] })

    const rows = values.mock.calls[0][0]
    expect(rows.map((r: { linkId: string }) => r.linkId)).toEqual(["a", "b"])
    expect(rows.every((r: { kind: string; fromUserId: string }) => r.kind === "sos" && r.fromUserId === OWNER)).toBe(true)
  })

  it("writes nothing when there is no sponsor to tell", async () => {
    await serveSponsors([])
    const values = await captureInsert()

    const { sendSos } = await import("@/lib/buddy-signals")
    expect(await sendSos(OWNER, NOW)).toEqual({ sent: 0, recipients: [] })
    expect(values).not.toHaveBeenCalled()
  })
})
