import { describe, it, expect } from "vitest"
import { getTableConfig } from "drizzle-orm/pg-core"
import { smokeLogs, rateLimits } from "@/db/schema"

describe("smoke_logs schema", () => {
  it("cascades deletes from users so no log outlives its owner", () => {
    const { foreignKeys } = getTableConfig(smokeLogs)
    const userFk = foreignKeys.find((fk) =>
      fk.reference().columns.some((col) => col.name === "user_id"),
    )

    expect(userFk).toBeDefined()
    expect(userFk!.onDelete).toBe("cascade")
  })
})

describe("rate_limits schema", () => {
  it("keys on subject so each subject has exactly one reusable row", () => {
    const { columns } = getTableConfig(rateLimits)
    const subject = columns.find((c) => c.name === "subject")

    expect(subject).toBeDefined()
    // The primary key is what makes ON CONFLICT DO UPDATE work, which is what
    // makes the counter atomic under concurrent requests.
    expect(subject!.primary).toBe(true)
  })

  it("starts every window with a count, never null", () => {
    const { columns } = getTableConfig(rateLimits)
    const count = columns.find((c) => c.name === "count")

    expect(count!.notNull).toBe(true)
    expect(count!.hasDefault).toBe(true)
  })
})
