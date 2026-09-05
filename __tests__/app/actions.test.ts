import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/db", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock("@/db/schema", () => ({
  smokeLogs: {
    id: "id",
    userId: "user_id",
    ts: "ts",
    cigarettes: "cigarettes",
    note: "note",
  },
}))

vi.mock("@/lib/auth/getOrCreateUser", () => ({
  getOrCreateUser: vi.fn(),
}))

vi.mock("@/lib/observability/logger", () => ({
  logError: vi.fn(),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

const USER_ID = "11111111-1111-1111-1111-111111111111"
const LOG_ID = "22222222-2222-2222-2222-222222222222"

describe("server actions: smoke logs", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("getLogs", () => {
    it("returns the user's logs ordered by most recent", async () => {
      const { db } = await import("@/db")
      const { getOrCreateUser } = await import("@/lib/auth/getOrCreateUser")
      vi.mocked(getOrCreateUser).mockResolvedValue(USER_ID)

      const rows = [{ id: LOG_ID, userId: USER_ID, cigarettes: 1, note: null, ts: new Date() }]
      vi.mocked(db.select).mockReturnValue({
        from: () => ({
          where: () => ({
            orderBy: () => Promise.resolve(rows),
          }),
        }),
      } as never)

      const { getLogs } = await import("@/app/app/actions")
      const result = await getLogs()

      expect(result).toEqual({ success: true, data: rows })
    })

    it("returns a failure result when the query throws", async () => {
      const { db } = await import("@/db")
      const { getOrCreateUser } = await import("@/lib/auth/getOrCreateUser")
      const { logError } = await import("@/lib/observability/logger")
      vi.mocked(getOrCreateUser).mockResolvedValue(USER_ID)

      vi.mocked(db.select).mockReturnValue({
        from: () => ({
          where: () => ({
            orderBy: () => Promise.reject(new Error("db down")),
          }),
        }),
      } as never)

      const { getLogs } = await import("@/app/app/actions")
      const result = await getLogs()

      expect(result).toEqual({ success: false, error: "Failed to fetch logs" })
      expect(logError).toHaveBeenCalledWith("get_logs_failed", expect.any(Error), { userId: USER_ID })
    })
  })

  describe("createLog", () => {
    it("creates a log and revalidates the app paths", async () => {
      const { db } = await import("@/db")
      const { getOrCreateUser } = await import("@/lib/auth/getOrCreateUser")
      const { revalidatePath } = await import("next/cache")
      vi.mocked(getOrCreateUser).mockResolvedValue(USER_ID)

      const created = { id: LOG_ID, userId: USER_ID, cigarettes: 2, note: "after lunch", ts: new Date() }
      const returning = vi.fn().mockResolvedValue([created])
      vi.mocked(db.insert).mockReturnValue({
        values: () => ({ returning }),
      } as never)

      const { createLog } = await import("@/app/app/actions")
      const result = await createLog({ cigarettes: 2, note: "after lunch" })

      expect(result).toEqual({ success: true, data: created })
      expect(revalidatePath).toHaveBeenCalledWith("/app")
      expect(revalidatePath).toHaveBeenCalledWith("/dashboard")
    })

    it("rejects invalid input without touching the database", async () => {
      const { db } = await import("@/db")
      const { getOrCreateUser } = await import("@/lib/auth/getOrCreateUser")
      vi.mocked(getOrCreateUser).mockResolvedValue(USER_ID)

      const { createLog } = await import("@/app/app/actions")
      const result = await createLog({ cigarettes: -1 })

      expect(result.success).toBe(false)
      expect(result).toHaveProperty("details")
      expect(db.insert).not.toHaveBeenCalled()
    })

    it("returns a failure result when the insert throws", async () => {
      const { db } = await import("@/db")
      const { getOrCreateUser } = await import("@/lib/auth/getOrCreateUser")
      const { logError } = await import("@/lib/observability/logger")
      vi.mocked(getOrCreateUser).mockResolvedValue(USER_ID)

      vi.mocked(db.insert).mockReturnValue({
        values: () => ({ returning: () => Promise.reject(new Error("insert failed")) }),
      } as never)

      const { createLog } = await import("@/app/app/actions")
      const result = await createLog({ cigarettes: 1 })

      expect(result).toEqual({ success: false, error: "Failed to create log" })
      expect(logError).toHaveBeenCalledWith("create_log_failed", expect.any(Error), { userId: USER_ID })
    })
  })

  describe("deleteLog", () => {
    it("deletes a log owned by the user", async () => {
      const { db } = await import("@/db")
      const { getOrCreateUser } = await import("@/lib/auth/getOrCreateUser")
      const { revalidatePath } = await import("next/cache")
      vi.mocked(getOrCreateUser).mockResolvedValue(USER_ID)

      const deleted = { id: LOG_ID, userId: USER_ID, cigarettes: 1, note: null, ts: new Date() }
      vi.mocked(db.delete).mockReturnValue({
        where: () => ({ returning: () => Promise.resolve([deleted]) }),
      } as never)

      const { deleteLog } = await import("@/app/app/actions")
      const result = await deleteLog({ id: LOG_ID })

      expect(result).toEqual({ success: true, data: deleted })
      expect(revalidatePath).toHaveBeenCalledWith("/app")
    })

    it("returns a failure result when the log does not belong to the user", async () => {
      const { db } = await import("@/db")
      const { getOrCreateUser } = await import("@/lib/auth/getOrCreateUser")
      vi.mocked(getOrCreateUser).mockResolvedValue(USER_ID)

      vi.mocked(db.delete).mockReturnValue({
        where: () => ({ returning: () => Promise.resolve([]) }),
      } as never)

      const { deleteLog } = await import("@/app/app/actions")
      const result = await deleteLog({ id: LOG_ID })

      expect(result).toEqual({ success: false, error: "Log not found or unauthorized" })
    })

    it("rejects a non-uuid id without touching the database", async () => {
      const { db } = await import("@/db")
      const { getOrCreateUser } = await import("@/lib/auth/getOrCreateUser")
      vi.mocked(getOrCreateUser).mockResolvedValue(USER_ID)

      const { deleteLog } = await import("@/app/app/actions")
      const result = await deleteLog({ id: "not-a-uuid" })

      expect(result.success).toBe(false)
      expect(db.delete).not.toHaveBeenCalled()
    })

    it("returns a failure result when the delete throws", async () => {
      const { db } = await import("@/db")
      const { getOrCreateUser } = await import("@/lib/auth/getOrCreateUser")
      const { logError } = await import("@/lib/observability/logger")
      vi.mocked(getOrCreateUser).mockResolvedValue(USER_ID)

      vi.mocked(db.delete).mockReturnValue({
        where: () => ({ returning: () => Promise.reject(new Error("delete failed")) }),
      } as never)

      const { deleteLog } = await import("@/app/app/actions")
      const result = await deleteLog({ id: LOG_ID })

      expect(result).toEqual({ success: false, error: "Failed to delete log" })
      expect(logError).toHaveBeenCalledWith("delete_log_failed", expect.any(Error), { userId: USER_ID })
    })
  })
})
