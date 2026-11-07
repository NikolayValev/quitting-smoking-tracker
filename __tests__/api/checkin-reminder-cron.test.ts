import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

vi.mock("@/lib/checkin-reminder.server", () => ({ sendCheckinReminders: vi.fn() }))
vi.mock("@/lib/observability/logger", () => ({ logError: vi.fn() }))

function call(authorization?: string) {
  return new Request("https://example.com/api/cron/checkin-reminder", {
    headers: authorization ? { authorization } : {},
  })
}

describe("GET /api/cron/checkin-reminder", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv("CRON_SECRET", "s3cret")
  })
  afterEach(() => vi.unstubAllEnvs())

  it("runs the reminders for Vercel Cron's bearer secret", async () => {
    const { sendCheckinReminders } = await import("@/lib/checkin-reminder.server")
    vi.mocked(sendCheckinReminders).mockResolvedValue({ due: 2, delivered: 3, removed: 0 })

    const { GET } = await import("@/app/api/cron/checkin-reminder/route")
    const response = await GET(call("Bearer s3cret"))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ due: 2, delivered: 3, removed: 0 })
  })

  it("refuses anyone else", async () => {
    const { sendCheckinReminders } = await import("@/lib/checkin-reminder.server")
    const { GET } = await import("@/app/api/cron/checkin-reminder/route")

    expect((await GET(call())).status).toBe(401)
    expect((await GET(call("Bearer wrong!"))).status).toBe(401)
    expect(sendCheckinReminders).not.toHaveBeenCalled()
  })

  it("refuses everyone while no secret is configured", async () => {
    // Otherwise "Bearer " with an empty secret would be the password.
    vi.stubEnv("CRON_SECRET", "")
    const { sendCheckinReminders } = await import("@/lib/checkin-reminder.server")
    const { GET } = await import("@/app/api/cron/checkin-reminder/route")

    expect((await GET(call("Bearer "))).status).toBe(401)
    expect(sendCheckinReminders).not.toHaveBeenCalled()
  })
})
