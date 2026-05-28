import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/db", () => ({
  db: {
    select: vi.fn(),
  },
}))

vi.mock("@/db/schema", () => ({
  users: {},
}))

vi.mock("drizzle-orm", () => ({
  sql: vi.fn(() => ({})),
}))

describe("GET /api/health", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns ok when database is reachable", async () => {
    const { db } = await import("@/db")
    vi.mocked(db.select).mockReturnValue({
      from: () => ({ limit: () => Promise.resolve([{ one: 1 }]) }),
    } as never)

    const { GET } = await import("@/app/api/health/route")
    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.status).toBe("ok")
    expect(body.timestamp).toBeTruthy()
  })

  it("returns degraded when database is unreachable", async () => {
    const { db } = await import("@/db")
    vi.mocked(db.select).mockReturnValue({
      from: () => ({ limit: () => Promise.reject(new Error("Connection refused")) }),
    } as never)

    const { GET } = await import("@/app/api/health/route")
    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(503)
    expect(body.status).toBe("degraded")
  })
})
