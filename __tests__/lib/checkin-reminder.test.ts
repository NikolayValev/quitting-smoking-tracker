import { describe, it, expect } from "vitest"
import { isReminderDue, isValidTimeZone, localDay } from "@/lib/checkin-reminder"

// 19:20 UTC on a winter day, inside the hour Vercel runs the cron.
const RUN = new Date("2025-03-01T19:20:00Z")

describe("localDay", () => {
  it("gives the date and hour where the person is, not in UTC", () => {
    expect(localDay(RUN, "Europe/London")).toEqual({ date: "2025-03-01", hour: 19 })
    expect(localDay(RUN, "America/New_York")).toEqual({ date: "2025-03-01", hour: 14 })
    // Already tomorrow in Tokyo.
    expect(localDay(RUN, "Asia/Tokyo")).toEqual({ date: "2025-03-02", hour: 4 })
  })

  it("follows summer time", () => {
    expect(localDay(new Date("2025-07-01T19:20:00Z"), "Europe/London").hour).toBe(20)
  })
})

describe("isValidTimeZone", () => {
  it("accepts IANA zones and refuses anything else", () => {
    expect(isValidTimeZone("Europe/Sofia")).toBe(true)
    expect(isValidTimeZone("UTC")).toBe(true)
    expect(isValidTimeZone("Not/AZone")).toBe(false)
    expect(isValidTimeZone("")).toBe(false)
  })
})

describe("isReminderDue", () => {
  const london = { now: RUN, timeZone: "Europe/London", remindedOn: null }

  it("reminds someone who has not checked in today", () => {
    expect(isReminderDue({ ...london, lastLogDate: "2025-02-28" })).toBe(true)
    expect(isReminderDue({ ...london, lastLogDate: null })).toBe(true)
  })

  it("leaves alone someone who already has", () => {
    expect(isReminderDue({ ...london, lastLogDate: "2025-03-01" })).toBe(false)
  })

  it("judges today by their day, not UTC's", () => {
    // 08:20 on the 2nd in Auckland. In UTC it is still the 1st, so a log for
    // the 1st would look like today's; there it is yesterday's.
    expect(
      isReminderDue({ now: RUN, timeZone: "Pacific/Auckland", remindedOn: null, lastLogDate: "2025-03-01" }),
    ).toBe(true)
  })

  it("never reminds overnight", () => {
    // 04:20 in Tokyo, 00:50 in Kolkata.
    for (const timeZone of ["Asia/Tokyo", "Asia/Kolkata"]) {
      expect(isReminderDue({ now: RUN, timeZone, remindedOn: null, lastLogDate: null })).toBe(false)
    }
  })

  it("reminds once a day even if the cron fires twice", () => {
    // Vercel cron delivery is at-least-once.
    expect(isReminderDue({ ...london, remindedOn: "2025-03-01", lastLogDate: null })).toBe(false)
    expect(isReminderDue({ ...london, remindedOn: "2025-02-28", lastLogDate: null })).toBe(true)
  })

  it("sends nothing for a zone it cannot read rather than throwing", () => {
    // One bad row must not stop everyone else's reminder.
    expect(
      isReminderDue({ now: RUN, timeZone: "Not/AZone", remindedOn: null, lastLogDate: null }),
    ).toBe(false)
  })
})
