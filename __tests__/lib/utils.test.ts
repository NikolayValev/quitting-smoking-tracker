import { describe, it, expect } from "vitest"
import { cn, formatCurrency, formatNumber, calculateSmokeFreeTime, calculateSavings } from "@/lib/utils"

describe("utils", () => {
  describe("cn", () => {
    it("merges class names correctly", () => {
      expect(cn("px-4", "py-2")).toBe("px-4 py-2")
      expect(cn("px-4", { "py-2": true, "bg-red": false })).toBe("px-4 py-2")
    })

    it("handles Tailwind conflicts", () => {
      expect(cn("px-4", "px-8")).toBe("px-8")
    })
  })

  describe("formatCurrency", () => {
    it("formats currency correctly", () => {
      expect(formatCurrency(10.5)).toBe("$10.50")
      expect(formatCurrency(1000)).toBe("$1,000.00")
    })
  })

  describe("formatNumber", () => {
    it("formats numbers with commas", () => {
      expect(formatNumber(1000)).toBe("1,000")
      expect(formatNumber(1234567)).toBe("1,234,567")
    })
  })

  describe("calculateSmokeFreeTime", () => {
    it("calculates time difference correctly", () => {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
      const result = calculateSmokeFreeTime(oneDayAgo)

      expect(result.days).toBe(1)
      expect(result.hours).toBe(0)
      expect(result.totalHours).toBe(24)
    })

    it("handles future dates", () => {
      const futureDate = new Date(Date.now() + 1000 * 60 * 60)
      const result = calculateSmokeFreeTime(futureDate)

      expect(result.days).toBe(0)
      expect(result.minutes).toBe(0)
    })
  })

  describe("calculateSavings", () => {
    it("calculates savings correctly", () => {
      const smokeFreeMinutes = 60 * 24 * 10 // 10 days
      const cigarettesPerDay = 20
      const costPerPack = 10
      const cigarettesPerPack = 20

      const savings = calculateSavings(smokeFreeMinutes, cigarettesPerDay, costPerPack, cigarettesPerPack)

      expect(savings).toBe(100) // 10 days * 20 cigs/day / 20 per pack * $10 = $100
    })
  })
})
