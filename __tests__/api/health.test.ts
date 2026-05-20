import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}))

describe("GET /api/health", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns ok when database is reachable", async () => {
    const { createClient } = await import("@/lib/supabase/server")
    vi.mocked(createClient).mockResolvedValue({
      from: () => ({
        select: () => ({
          limit: () => Promise.resolve({ data: [], error: null }),
        }),
      }),
    } as never)

    const { GET } = await import("@/app/api/health/route")
    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.status).toBe("ok")
    expect(body.timestamp).toBeTruthy()
  })

  it("returns degraded when database is unreachable", async () => {
    const { createClient } = await import("@/lib/supabase/server")
    vi.mocked(createClient).mockResolvedValue({
      from: () => ({
        select: () => ({
          limit: () => Promise.resolve({ data: null, error: new Error("Connection refused") }),
        }),
      }),
    } as never)

    const { GET } = await import("@/app/api/health/route")
    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(503)
    expect(body.status).toBe("degraded")
  })
})
