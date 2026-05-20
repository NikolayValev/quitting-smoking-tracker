import { describe, it, expect } from "vitest"
import {
  wellnessTips,
  copingStrategies,
  milestoneDefinitions,
  relaxationTechniques,
} from "@/lib/data/wellness-tips"

describe("wellness-tips data", () => {
  describe("wellnessTips", () => {
    it("has at least 5 tips", () => {
      expect(wellnessTips.length).toBeGreaterThanOrEqual(5)
    })

    it("every tip has required fields", () => {
      for (const tip of wellnessTips) {
        expect(tip.id).toBeTruthy()
        expect(tip.title).toBeTruthy()
        expect(tip.description).toBeTruthy()
        expect(["health", "motivation", "coping", "financial", "lifestyle"]).toContain(tip.category)
      }
    })

    it("tip ids are unique", () => {
      const ids = wellnessTips.map((t) => t.id)
      expect(new Set(ids).size).toBe(ids.length)
    })
  })

  describe("copingStrategies", () => {
    it("has at least 4 strategies", () => {
      expect(copingStrategies.length).toBeGreaterThanOrEqual(4)
    })

    it("every strategy has a non-empty steps array", () => {
      for (const strategy of copingStrategies) {
        expect(strategy.steps.length).toBeGreaterThan(0)
        expect(strategy.title).toBeTruthy()
        expect(strategy.description).toBeTruthy()
      }
    })
  })

  describe("milestoneDefinitions", () => {
    it("has at least 10 milestones", () => {
      expect(milestoneDefinitions.length).toBeGreaterThanOrEqual(10)
    })

    it("every milestone has required fields", () => {
      for (const milestone of milestoneDefinitions) {
        expect(milestone.type).toBeTruthy()
        expect(milestone.label).toBeTruthy()
        expect(milestone.description).toBeTruthy()
      }
    })

    it("milestone types are unique", () => {
      const types = milestoneDefinitions.map((m) => m.type)
      expect(new Set(types).size).toBe(types.length)
    })

    it("includes 1-year milestone", () => {
      expect(milestoneDefinitions.some((m) => m.type === "1_year")).toBe(true)
    })
  })

  describe("relaxationTechniques", () => {
    it("has at least 3 techniques", () => {
      expect(relaxationTechniques.length).toBeGreaterThanOrEqual(3)
    })

    it("every technique has required fields", () => {
      for (const technique of relaxationTechniques) {
        expect(technique.title).toBeTruthy()
        expect(technique.description).toBeTruthy()
      }
    })
  })
})
