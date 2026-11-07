import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("server-only", () => ({}))
vi.mock("@/lib/push", () => ({ pushToUsers: vi.fn() }))
vi.mock("@/db", () => ({ db: { select: vi.fn(), update: vi.fn() } }))

// 19:20 UTC: 19:20 in London, 14:20 in New York, 04:20 in Tokyo.
const RUN = new Date("2025-03-01T19:20:00Z")

type Candidate = { id: string; timeZone: string; remindedOn: string | null; lastLogDate: string | null }

async function serve(candidates: Candidate[]) {
  const { db } = await import("@/db")
  // One chain serves both the outer query and the EXISTS subquery inside it.
  const chain: Record<string, unknown> = {}
  for (const method of ["from", "leftJoin", "where"]) chain[method] = () => chain
  chain.groupBy = () => Promise.resolve(candidates)
  vi.mocked(db.select).mockReturnValue(chain as never)

  const set = vi.fn(() => ({ where: vi.fn().mockResolvedValue(undefined) }))
  vi.mocked(db.update).mockReturnValue({ set } as never)

  const { pushToUsers } = await import("@/lib/push")
  vi.mocked(pushToUsers).mockResolvedValue({ delivered: 1, removed: 0 })
  return { set, pushToUsers: vi.mocked(pushToUsers) }
}

describe("sendCheckinReminders", () => {
  beforeEach(() => vi.clearAllMocks())

  it("reminds only those due, and marks each with their own day first", async () => {
    const { set, pushToUsers } = await serve([
      { id: "london", timeZone: "Europe/London", remindedOn: null, lastLogDate: "2025-02-28" },
      { id: "ny", timeZone: "America/New_York", remindedOn: null, lastLogDate: null },
      { id: "logged", timeZone: "Europe/London", remindedOn: null, lastLogDate: "2025-03-01" },
      { id: "asleep", timeZone: "Asia/Tokyo", remindedOn: null, lastLogDate: null },
      { id: "twice", timeZone: "Europe/London", remindedOn: "2025-03-01", lastLogDate: null },
    ])

    const { sendCheckinReminders } = await import("@/lib/checkin-reminder.server")
    const result = await sendCheckinReminders(RUN)

    expect(result.due).toBe(2)
    expect(set).toHaveBeenCalledWith({ remindedOn: "2025-03-01" })
    expect(pushToUsers).toHaveBeenCalledTimes(1)
    const [ids, message, delivery] = pushToUsers.mock.calls[0]
    expect(ids.sort()).toEqual(["london", "ny"])
    expect(message.tag).toBe("checkin")
    // A reminder held overnight for a phone that was off is worse than none.
    expect(delivery?.ttlSeconds).toBeLessThanOrEqual(3 * 60 * 60)

    // Marked before the push, so a repeated cron run cannot send twice.
    expect(set.mock.invocationCallOrder[0]).toBeLessThan(pushToUsers.mock.invocationCallOrder[0])
  })

  it("sends and writes nothing when nobody is due", async () => {
    const { set, pushToUsers } = await serve([
      { id: "logged", timeZone: "Europe/London", remindedOn: null, lastLogDate: "2025-03-01" },
    ])

    const { sendCheckinReminders } = await import("@/lib/checkin-reminder.server")
    expect(await sendCheckinReminders(RUN)).toEqual({ due: 0, delivered: 0, removed: 0 })
    expect(set).not.toHaveBeenCalled()
    expect(pushToUsers).not.toHaveBeenCalled()
  })
})
