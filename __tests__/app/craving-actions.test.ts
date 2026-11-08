import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/lib/auth/getOrCreateUser", () => ({ getOrCreateUser: vi.fn() }))
vi.mock("@/lib/rate-limit", () => ({ consumeRateLimit: vi.fn() }))
vi.mock("@/lib/observability/logger", () => ({ logError: vi.fn() }))
vi.mock("@/lib/cravings.server", () => ({ recordCraving: vi.fn() }))

const USER = "11111111-1111-4111-8111-111111111111"
const CRAVING = { substance: "cigarettes", trigger: "coffee", strength: 4, outcome: "passed", localHour: 8 }

async function signedIn(allowed = true) {
  const { getOrCreateUser } = await import("@/lib/auth/getOrCreateUser")
  const { consumeRateLimit } = await import("@/lib/rate-limit")
  vi.mocked(getOrCreateUser).mockResolvedValue(USER)
  vi.mocked(consumeRateLimit).mockResolvedValue({ allowed, used: 1, limit: 30, resetAt: new Date() })
}

describe("recordCraving", () => {
  beforeEach(() => vi.clearAllMocks())

  it("records a craving against the signed-in user", async () => {
    await signedIn()
    const { recordCraving: store } = await import("@/lib/cravings.server")

    const { recordCraving } = await import("@/app/wellness/actions")
    expect(await recordCraving(CRAVING)).toEqual({ success: true })
    expect(store).toHaveBeenCalledWith(USER, CRAVING)
  })

  it("accepts only the preset triggers, never text", async () => {
    await signedIn()
    const { recordCraving: store } = await import("@/lib/cravings.server")

    const { recordCraving } = await import("@/app/wellness/actions")
    const result = await recordCraving({ ...CRAVING, trigger: "my ex texted me" })

    expect(result.success).toBe(false)
    expect(store).not.toHaveBeenCalled()
  })

  it("refuses a strength or hour out of range", async () => {
    await signedIn()
    const { recordCraving } = await import("@/app/wellness/actions")

    expect((await recordCraving({ ...CRAVING, strength: 6 })).success).toBe(false)
    expect((await recordCraving({ ...CRAVING, localHour: 24 })).success).toBe(false)
  })

  it("refuses a craving with no substance, or one it does not know", async () => {
    await signedIn()
    const { recordCraving } = await import("@/app/wellness/actions")
    const withoutSubstance: Partial<typeof CRAVING> = { ...CRAVING }
    delete withoutSubstance.substance

    expect((await recordCraving(withoutSubstance)).success).toBe(false)
    expect((await recordCraving({ ...CRAVING, substance: "alcohol" })).success).toBe(false)
  })

  it("is rate limited like every other write", async () => {
    await signedIn(false)
    const { recordCraving: store } = await import("@/lib/cravings.server")

    const { recordCraving } = await import("@/app/wellness/actions")
    expect((await recordCraving(CRAVING)).success).toBe(false)
    expect(store).not.toHaveBeenCalled()
  })
})
