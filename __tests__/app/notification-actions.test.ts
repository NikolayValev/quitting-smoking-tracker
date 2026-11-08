import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/auth/getOrCreateUser", () => ({ getOrCreateUser: vi.fn() }))
vi.mock("@/lib/rate-limit", () => ({ consumeRateLimit: vi.fn() }))
vi.mock("@/lib/observability/logger", () => ({ logError: vi.fn() }))
vi.mock("@/lib/push", () => ({ saveSubscription: vi.fn(), removeSubscription: vi.fn() }))
vi.mock("@/lib/checkin-reminder.server", () => ({ setCheckinReminder: vi.fn() }))

const USER = "11111111-1111-4111-8111-111111111111"
const SUB = {
  endpoint: "https://fcm.googleapis.com/fcm/send/abc",
  keys: { p256dh: "BNc...", auth: "xyz" },
}

async function signedIn() {
  const { getOrCreateUser } = await import("@/lib/auth/getOrCreateUser")
  const { consumeRateLimit } = await import("@/lib/rate-limit")
  vi.mocked(getOrCreateUser).mockResolvedValue(USER)
  vi.mocked(consumeRateLimit).mockResolvedValue({ allowed: true, used: 1, limit: 30, resetAt: new Date() })
}

describe("savePushSubscription", () => {
  beforeEach(() => vi.clearAllMocks())

  it("stores a browser's subscription against the signed-in user", async () => {
    await signedIn()
    const { saveSubscription } = await import("@/lib/push")

    const { savePushSubscription } = await import("@/app/notifications/actions")
    expect(await savePushSubscription(SUB)).toEqual({ success: true })
    expect(saveSubscription).toHaveBeenCalledWith(USER, SUB)
  })

  it("refuses an endpoint that is not https", async () => {
    // Otherwise a caller could have this server POST anywhere it liked.
    await signedIn()
    const { saveSubscription } = await import("@/lib/push")

    const { savePushSubscription } = await import("@/app/notifications/actions")
    const result = await savePushSubscription({ ...SUB, endpoint: "http://169.254.169.254/latest" })

    expect(result.success).toBe(false)
    expect(saveSubscription).not.toHaveBeenCalled()
  })
})

describe("removePushSubscription", () => {
  beforeEach(() => vi.clearAllMocks())

  it("removes only on behalf of the signed-in user", async () => {
    await signedIn()
    const { removeSubscription } = await import("@/lib/push")

    const { removePushSubscription } = await import("@/app/notifications/actions")
    await removePushSubscription({ endpoint: SUB.endpoint })

    expect(removeSubscription).toHaveBeenCalledWith(USER, SUB.endpoint)
  })
})

describe("setCheckinReminder", () => {
  beforeEach(() => vi.clearAllMocks())

  it("turns the reminder on in the browser's time zone", async () => {
    await signedIn()
    const { setCheckinReminder: store } = await import("@/lib/checkin-reminder.server")

    const { setCheckinReminder } = await import("@/app/notifications/actions")
    expect(await setCheckinReminder({ timeZone: "Europe/London" })).toEqual({ success: true })
    expect(store).toHaveBeenCalledWith(USER, "Europe/London")
  })

  it("turns it off with null", async () => {
    await signedIn()
    const { setCheckinReminder: store } = await import("@/lib/checkin-reminder.server")

    const { setCheckinReminder } = await import("@/app/notifications/actions")
    await setCheckinReminder({ timeZone: null })
    expect(store).toHaveBeenCalledWith(USER, null)
  })

  it("refuses a zone it cannot read", async () => {
    // Stored, it would be skipped every day and the person never reminded.
    await signedIn()
    const { setCheckinReminder: store } = await import("@/lib/checkin-reminder.server")

    const { setCheckinReminder } = await import("@/app/notifications/actions")
    const result = await setCheckinReminder({ timeZone: "Mars/Olympus_Mons" })

    expect(result.success).toBe(false)
    expect(store).not.toHaveBeenCalled()
  })
})
