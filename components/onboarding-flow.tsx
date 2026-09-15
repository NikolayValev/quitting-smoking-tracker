"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { SettingsForm } from "@/components/settings-form"
import { Logo } from "@/components/logo"
import { createLog } from "@/app/app/actions"
import { captureDailyLog } from "@/lib/analytics/posthog"
import type { UserSettings } from "@/lib/user-settings"

function localToday(): string {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 10)
}

/**
 * Two steps: what the savings are reckoned from, then the first check-in.
 *
 * Settings come first because they are the part that cannot be inferred later —
 * a check-in can be corrected, but nobody goes back to tell the app what a pack
 * used to cost. Both steps are skippable; every setting has a documented
 * fallback, and refusing to let someone into the app until they have priced
 * their habit would be a poor first thing to ask of them.
 */
export function OnboardingFlow({ settings }: { settings: UserSettings }) {
  const router = useRouter()
  const [step, setStep] = useState<"settings" | "first-log">("settings")
  const [cigarettes, setCigarettes] = useState("")
  const [note, setNote] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submitFirstLog = async (e: React.FormEvent) => {
    e.preventDefault()

    const count = Number.parseInt(cigarettes, 10)
    if (Number.isNaN(count) || count < 0) {
      setError("Enter a number, 0 or more.")
      return
    }

    setBusy(true)
    setError(null)

    const result = await createLog({
      cigarettes: count,
      note: note || undefined,
      date: localToday(),
    })

    setBusy(false)
    if (!result.success) {
      setError(result.error ?? "Could not save that")
      return
    }

    // Bucketed count and whether a note was written — never the note itself.
    captureDailyLog(count, note.trim().length > 0)
    router.push("/dashboard")
  }

  return (
    <main className="container mx-auto max-w-xl px-4 py-16">
      <Logo />

      {step === "settings" ? (
        <section className="mt-10">
          <h1 className="text-3xl font-semibold tracking-tight">
            What was your habit costing you?
          </h1>
          <p className="mt-3 max-w-[52ch] text-muted-foreground">
            This is what the savings on your dashboard are worked out from. You can
            change it later, and skip it for now if you would rather.
          </p>

          <div className="mt-8">
            <SettingsForm
              settings={settings}
              submitLabel="Continue"
              onSaved={() => setStep("first-log")}
            />
          </div>

          <Button
            variant="ghost"
            className="mt-4"
            onClick={() => setStep("first-log")}
          >
            Skip for now
          </Button>
        </section>
      ) : (
        <section className="mt-10">
          <h1 className="text-3xl font-semibold tracking-tight">How did today go?</h1>
          <p className="mt-3 max-w-[52ch] text-muted-foreground">
            One check-in starts your streak. Enter 0 if you have been smoke-free today.
          </p>

          <form onSubmit={submitFirstLog} className="mt-8 space-y-5">
            {error && (
              <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="onboarding-count">Cigarettes smoked today</Label>
              <Input
                id="onboarding-count"
                type="number"
                min="0"
                inputMode="numeric"
                placeholder="0"
                value={cigarettes}
                onChange={(e) => { setCigarettes(e.target.value); setError(null) }}
                required
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="onboarding-note">
                Note <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                id="onboarding-note"
                rows={3}
                placeholder="How are you feeling?"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={busy}>
                {busy ? "Saving…" : "Start tracking"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setStep("settings")}>
                Back
              </Button>
            </div>
          </form>
        </section>
      )}
    </main>
  )
}
