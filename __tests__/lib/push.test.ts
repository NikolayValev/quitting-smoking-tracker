import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

vi.mock("server-only", () => ({}))
vi.mock("web-push", () => ({ default: { sendNotification: vi.fn() } }))
vi.mock("@/db", () => ({
  db: { select: vi.fn(), delete: vi.fn(), insert: vi.fn() },
}))

const MESSAGE = { title: "t", body: "b", url: "/buddies", tag: "sos" }

function device(id: string) {
  return { id, userId: "u", endpoint: `https://push.example/${id}`, p256dh: "k", auth: "a" }
}

async function serveDevices(rows: unknown[]) {
  const { db } = await import("@/db")
  vi.mocked(db.select).mockReturnValue({
    from: () => ({ where: () => Promise.resolve(rows) }),
  } as never)
  const where = vi.fn().mockResolvedValue(undefined)
  vi.mocked(db.delete).mockReturnValue({ where } as never)
  return where
}

describe("pushToUsers", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv("NEXT_PUBLIC_VAPID_PUBLIC_KEY", "pub")
    vi.stubEnv("VAPID_PRIVATE_KEY", "priv")
  })
  afterEach(() => vi.unstubAllEnvs())

  it("does nothing at all until keys are configured", async () => {
    vi.stubEnv("VAPID_PRIVATE_KEY", "")
    const { db } = await import("@/db")

    const { pushToUsers } = await import("@/lib/push")
    expect(await pushToUsers(["u"], MESSAGE)).toEqual({ delivered: 0, removed: 0 })
    expect(db.select).not.toHaveBeenCalled()
  })

  it("deletes devices the push service says are gone, and keeps the rest", async () => {
    const deleteWhere = await serveDevices([device("ok"), device("gone"), device("flaky")])
    const webpush = (await import("web-push")).default
    vi.mocked(webpush.sendNotification)
      .mockResolvedValueOnce({} as never)
      .mockRejectedValueOnce({ statusCode: 410 })
      .mockRejectedValueOnce({ statusCode: 500 })

    const { pushToUsers } = await import("@/lib/push")
    const result = await pushToUsers(["u"], MESSAGE)

    // A 500 is the push service having a bad moment, not the device leaving.
    expect(result).toEqual({ delivered: 1, removed: 1 })
    expect(deleteWhere).toHaveBeenCalledTimes(1)
  })

  it("does not throw when every delivery fails", async () => {
    await serveDevices([device("a")])
    const webpush = (await import("web-push")).default
    vi.mocked(webpush.sendNotification).mockRejectedValue(new Error("network"))

    const { pushToUsers } = await import("@/lib/push")
    await expect(pushToUsers(["u"], MESSAGE)).resolves.toEqual({ delivered: 0, removed: 0 })
  })
})
