import { describe, it, expect } from "vitest"
import { getTableConfig } from "drizzle-orm/pg-core"
import { smokeLogs } from "@/db/schema"

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
