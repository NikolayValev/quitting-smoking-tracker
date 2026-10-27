import { describe, it, expect } from "vitest"
import { relativeTime } from "@/lib/relative-time"

const NOW = new Date("2025-03-01T12:00:00.000Z")
const ago = (ms: number) => new Date(NOW.getTime() - ms)

describe("relativeTime", () => {
  it("speaks in the largest unit that fits", () => {
    expect(relativeTime(ago(30_000), NOW)).toBe("just now")
    expect(relativeTime(ago(5 * 60_000), NOW)).toBe("5 minutes ago")
    expect(relativeTime(ago(2 * 3_600_000), NOW)).toBe("2 hours ago")
    expect(relativeTime(ago(86_400_000), NOW)).toBe("yesterday")
    expect(relativeTime(ago(3 * 86_400_000), NOW)).toBe("3 days ago")
  })
})
