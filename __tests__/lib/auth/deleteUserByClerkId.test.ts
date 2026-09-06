import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/db", () => ({
  db: {
    transaction: vi.fn(),
  },
}))

const CLERK_USER_ID = "user_123"
const INTERNAL_USER_ID = "11111111-1111-4111-8111-111111111111"

/**
 * Builds a fake Drizzle transaction that records every delete target and
 * returns `rows` from its single select. Mirrors the chained builder shape the
 * real client exposes, so the code under test is written against Drizzle's API
 * rather than against the mock.
 */
function fakeTransaction(rows: Array<{ id: string }>) {
  const deletedFrom: unknown[] = []

  const tx = {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve(rows),
        }),
      }),
    }),
    delete: (table: unknown) => {
      deletedFrom.push(table)
      return { where: () => Promise.resolve(undefined) }
    },
  }

  return { tx, deletedFrom }
}

describe("deleteUserByClerkId", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("deletes the user's smoke logs before deleting the user row", async () => {
    const { db } = await import("@/db")
    const { users, smokeLogs } = await import("@/db/schema")
    const { tx, deletedFrom } = fakeTransaction([{ id: INTERNAL_USER_ID }])
    vi.mocked(db.transaction).mockImplementation((cb) => (cb as (t: unknown) => never)(tx))

    const { deleteUserByClerkId } = await import("@/lib/auth/deleteUserByClerkId")
    const result = await deleteUserByClerkId(CLERK_USER_ID)

    expect(result).toEqual({ deleted: true })
    expect(deletedFrom).toEqual([smokeLogs, users])
  })

  it("reports nothing deleted when no user matches the Clerk id", async () => {
    const { db } = await import("@/db")
    const { tx, deletedFrom } = fakeTransaction([])
    vi.mocked(db.transaction).mockImplementation((cb) => (cb as (t: unknown) => never)(tx))

    const { deleteUserByClerkId } = await import("@/lib/auth/deleteUserByClerkId")
    const result = await deleteUserByClerkId("user_does_not_exist")

    expect(result).toEqual({ deleted: false })
    expect(deletedFrom).toEqual([])
  })
})
