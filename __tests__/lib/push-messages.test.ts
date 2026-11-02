import { describe, it, expect } from "vitest"
import { CHEER_TEXT, cheerMessage, sosMessage } from "@/lib/push-messages"

describe("push messages", () => {
  const all = [sosMessage(), ...Object.keys(CHEER_TEXT).map((k) => cheerMessage(k as keyof typeof CHEER_TEXT))]

  it("say nothing on a lock screen about smoking or slips", () => {
    // Anyone near the phone can read these. The detail is behind sign-in.
    for (const message of all) {
      const text = `${message.title} ${message.body}`.toLowerCase()
      expect(text).not.toMatch(/smok|cigarette|slip|relapse|craving|nicotine/)
    }
  })

  it("take no arguments that could carry a name", () => {
    // The builders accept a preset key at most, so there is no route for a
    // person's name into a notification.
    expect(sosMessage.length).toBe(0)
    expect(cheerMessage.length).toBe(1)
  })

  it("only ever open a path inside the app", () => {
    for (const message of all) expect(message.url.startsWith("/")).toBe(true)
  })
})
