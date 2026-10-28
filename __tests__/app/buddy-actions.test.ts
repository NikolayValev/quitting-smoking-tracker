import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/auth/getOrCreateUser", () => ({ getOrCreateUser: vi.fn() }))
vi.mock("@/lib/rate-limit", () => ({ consumeRateLimit: vi.fn() }))
vi.mock("@/lib/observability/logger", () => ({ logError: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/lib/buddies", () => ({
  createInvite: vi.fn(),
  acceptInvite: vi.fn(),
  revokeLink: vi.fn(),
}))
vi.mock("@/lib/buddy-signals", () => ({
  sendCheer: vi.fn(),
  sendSos: vi.fn(),
}))

const USER = "11111111-1111-4111-8111-111111111111"

async function signedIn(allowed = true) {
  const { getOrCreateUser } = await import("@/lib/auth/getOrCreateUser")
  const { consumeRateLimit } = await import("@/lib/rate-limit")
  vi.mocked(getOrCreateUser).mockResolvedValue(USER)
  vi.mocked(consumeRateLimit).mockResolvedValue({
    allowed,
    used: 1,
    limit: 5,
    resetAt: new Date(),
  })
}

describe("createBuddyInvite", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns a code once", async () => {
    await signedIn()
    const { createInvite } = await import("@/lib/buddies")
    vi.mocked(createInvite).mockResolvedValue({ code: "ABC123XYZ", expiresAt: new Date() })

    const { createBuddyInvite } = await import("@/app/buddies/actions")
    const result = await createBuddyInvite()

    expect(result.success).toBe(true)
    if (result.success) expect(result.data.code).toBe("ABC123XYZ")
  })

  it("mints nothing once the invite budget is spent", async () => {
    // Each live code is a key to someone's streak until it expires. Without a
    // limit one account can mint them without end.
    await signedIn(false)
    const { createInvite } = await import("@/lib/buddies")

    const { createBuddyInvite } = await import("@/app/buddies/actions")
    const result = await createBuddyInvite()

    expect(result.success).toBe(false)
    expect(createInvite).not.toHaveBeenCalled()
  })

  it("meters invites apart from the ordinary write budget", async () => {
    await signedIn()
    const { consumeRateLimit } = await import("@/lib/rate-limit")
    const { createInvite } = await import("@/lib/buddies")
    vi.mocked(createInvite).mockResolvedValue({ code: "C", expiresAt: new Date() })

    const { createBuddyInvite } = await import("@/app/buddies/actions")
    await createBuddyInvite()

    const subject = vi.mocked(consumeRateLimit).mock.calls[0][0]
    expect(subject).toContain(USER)
    expect(subject).not.toBe(`user:${USER}`)
  })
})

describe("acceptBuddyInvite", () => {
  beforeEach(() => vi.clearAllMocks())

  it("explains an expired invite in words a person can act on", async () => {
    await signedIn()
    const { acceptInvite } = await import("@/lib/buddies")
    vi.mocked(acceptInvite).mockResolvedValue({ ok: false, reason: "expired" })

    const { acceptBuddyInvite } = await import("@/app/buddies/actions")
    const result = await acceptBuddyInvite({ code: "SOMECODE123" })

    expect(result.success).toBe(false)
    expect(result.error).toMatch(/expired/i)
    expect(result.error).toMatch(/new one/i)
  })

  it("refuses an invite to yourself", async () => {
    await signedIn()
    const { acceptInvite } = await import("@/lib/buddies")
    vi.mocked(acceptInvite).mockResolvedValue({ ok: false, reason: "self" })

    const { acceptBuddyInvite } = await import("@/app/buddies/actions")
    const result = await acceptBuddyInvite({ code: "SOMECODE123" })

    expect(result.error).toMatch(/your own buddy/i)
  })

  it("rejects a malformed code without reaching the database", async () => {
    await signedIn()
    const { acceptInvite } = await import("@/lib/buddies")

    const { acceptBuddyInvite } = await import("@/app/buddies/actions")
    const result = await acceptBuddyInvite({ code: "x" })

    expect(result.success).toBe(false)
    expect(acceptInvite).not.toHaveBeenCalled()
  })
})

describe("revokeBuddyLink", () => {
  beforeEach(() => vi.clearAllMocks())

  it("answers the same whether the link is missing or someone else's", async () => {
    // Otherwise the difference between the two replies tells a caller which
    // link ids exist, which is a way to probe other people's shares.
    await signedIn()
    const { revokeLink } = await import("@/lib/buddies")
    vi.mocked(revokeLink).mockResolvedValue({ revoked: false })

    const { revokeBuddyLink } = await import("@/app/buddies/actions")
    const missing = await revokeBuddyLink({
      linkId: "33333333-3333-4333-8333-333333333333",
    })
    const notMine = await revokeBuddyLink({
      linkId: "44444444-4444-4444-8444-444444444444",
    })

    expect(missing).toEqual(notMine)
  })

  it("stops a share the user owns", async () => {
    await signedIn()
    const { revokeLink } = await import("@/lib/buddies")
    vi.mocked(revokeLink).mockResolvedValue({ revoked: true })

    const { revokeBuddyLink } = await import("@/app/buddies/actions")
    const result = await revokeBuddyLink({
      linkId: "33333333-3333-4333-8333-333333333333",
    })

    expect(result.success).toBe(true)
  })
})

describe("createBuddyInvite roles", () => {
  beforeEach(() => vi.clearAllMocks())

  it("mints a sponsor invite when asked, and a buddy one by default", async () => {
    await signedIn()
    const { createInvite } = await import("@/lib/buddies")
    vi.mocked(createInvite).mockResolvedValue({ code: "C", expiresAt: new Date() })

    const { createBuddyInvite } = await import("@/app/buddies/actions")
    await createBuddyInvite({ role: "sponsor" })
    await createBuddyInvite()

    expect(vi.mocked(createInvite).mock.calls.map((call) => call[1])).toEqual(["sponsor", "buddy"])
  })

  it("refuses a role that does not exist", async () => {
    await signedIn()
    const { createInvite } = await import("@/lib/buddies")

    const { createBuddyInvite } = await import("@/app/buddies/actions")
    const result = await createBuddyInvite({ role: "admin" })

    expect(result.success).toBe(false)
    expect(createInvite).not.toHaveBeenCalled()
  })
})

describe("sendSosSignal", () => {
  beforeEach(() => vi.clearAllMocks())

  it("says plainly when there is nobody to tell", async () => {
    await signedIn()
    const { sendSos } = await import("@/lib/buddy-signals")
    vi.mocked(sendSos).mockResolvedValue({ sent: 0 })

    const { sendSosSignal } = await import("@/app/buddies/actions")
    const result = await sendSosSignal()

    expect(result).toEqual({ success: false, error: expect.stringMatching(/sponsor/i) })
  })

  it("meters signals on their own subject", async () => {
    await signedIn()
    const { consumeRateLimit } = await import("@/lib/rate-limit")
    const { sendSos } = await import("@/lib/buddy-signals")
    vi.mocked(sendSos).mockResolvedValue({ sent: 1 })

    const { sendSosSignal } = await import("@/app/buddies/actions")
    const result = await sendSosSignal()

    expect(result.success).toBe(true)
    expect(vi.mocked(consumeRateLimit).mock.calls[0][0]).toBe(`signal:${USER}`)
  })
})

describe("sendCheerSignal", () => {
  beforeEach(() => vi.clearAllMocks())

  it("only sends one of the presets", async () => {
    // Free text would make this a messaging feature that needs moderating.
    await signedIn()
    const { sendCheer } = await import("@/lib/buddy-signals")

    const { sendCheerSignal } = await import("@/app/buddies/actions")
    const result = await sendCheerSignal({
      linkId: "33333333-3333-4333-8333-333333333333",
      kind: "anything I like",
    })

    expect(result.success).toBe(false)
    expect(sendCheer).not.toHaveBeenCalled()
  })

  it("answers the same when the link is not theirs", async () => {
    await signedIn()
    const { sendCheer } = await import("@/lib/buddy-signals")
    vi.mocked(sendCheer).mockResolvedValue({ sent: false })

    const { sendCheerSignal } = await import("@/app/buddies/actions")
    const result = await sendCheerSignal({
      linkId: "33333333-3333-4333-8333-333333333333",
      kind: "proud",
    })

    expect(result).toEqual({ success: false, error: "Could not send that" })
  })
})
