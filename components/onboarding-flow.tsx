"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { SettingsForm } from "@/components/settings-form"
import { QuittingChoice } from "@/components/quitting-choice"
import { CountFields, parseCounts, type CountDraft } from "@/components/count-fields"
import { Logo } from "@/components/logo"
import { createLog } from "@/app/app/actions"
import { saveSettings } from "@/app/settings/actions"
import { captureDailyLog } from "@/lib/analytics/posthog"
import { tracked, type Quitting } from "@/lib/substances"
import type { UserSettings } from "@/lib/user-settings"

function localToday(): string {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 10)
}

const COST_HEADLINE: Record<Quitting, string> = {
  cigarettes: "What were cigarettes costing you?",
  cannabis: "What was cannabis costing you?",
  both: "What were they costing you?",
}

const FIRST_LOG_HINT: Record<Quitting, string> = {
  cigarettes: "One check-in starts your streak. Enter 0 if you have been smoke-free today.",
  cannabis: "One check-in starts your streak. Enter 0 if you have not used cannabis today.",
  both: "One check-in starts both streaks. Enter 0 for anything you have not used today.",
}

/**
 * Three steps: what is being quit, what it cost, then the first check-in.
 *
 * What is being quit comes first because everything after it depends on it:
 * which prices to ask for, which counts to log, which withdrawal to describe.
 * Settings come next because they are the part that cannot be inferred later —
 * a check-in can be corrected, but nobody goes back to tell the app what a pack
 * used to cost. The cost step is skippable; every setting has a documented
 * fallback, and refusing to let someone into the app until they have priced
 * their habit would be a poor first thing to ask of them.
 */
export function OnboardingFlow({ settings }: { settings: UserSettings }) {
  const router = useRouter()
  const [step, setStep] = useState<"quitting" | "settings" | "first-log">("quitting")
  const [quitting, setQuitting] = useState<Quitting>(settings.quitting)
  const [draft, setDraft] = useState<CountDraft>({})
  const [note, setNote] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submitQuitting = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const result = await saveSettings({ quitting })
    setBusy(false)
    if (!result.success) {
      setError(result.error)
      return
    }
    setStep("settings")
  }

  const submitFirstLog = async (e: React.FormEvent) => {
    e.preventDefault()

    const parsed = parseCounts(tracked(quitting), draft)
    if (!parsed.ok) {
      setError(parsed.error)
      return
    }

    setBusy(true)
    setError(null)

    const result = await createLog({
      ...parsed.counts,
      note: note || undefined,
      date: localToday(),
    })

    setBusy(false)
    if (!result.success) {
      setError(result.error ?? "Could not save that")
      return
    }

    // Bucketed total and whether a note was written — never the note itself.
    captureDailyLog(parsed.total, note.trim().length > 0)
    router.push("/dashboard")
  }

  const errorBox = error && (
    <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive" role="alert">
      {error}
    </p>
  )

  return (
    <main className="container mx-auto max-w-xl px-4 py-16">
      <Logo />

      {step === "quitting" && (
        <section className="mt-10">
          <h1 className="text-3xl font-semibold tracking-tight">What are you quitting?</h1>
          <p className="mt-3 max-w-[52ch] text-muted-foreground">
            The check-ins, the withdrawal notes and the plans all follow from this. You
            can change it later.
          </p>

          <form onSubmit={submitQuitting} className="mt-8 space-y-6">
            {errorBox}
            <QuittingChoice
              value={quitting}
              onChange={setQuitting}
              label="Choose one"
            />
            <p className="max-w-[58ch] text-sm text-muted-foreground">
              Nobody you share your progress with is told which. They see a streak, not
              what it is a streak of.
            </p>
            <Button type="submit" disabled={busy}>
              {busy ? "Saving…" : "Continue"}
            </Button>
          </form>
        </section>
      )}

      {step === "settings" && (
        <section className="mt-10">
          <h1 className="text-3xl font-semibold tracking-tight">{COST_HEADLINE[quitting]}</h1>
          <p className="mt-3 max-w-[52ch] text-muted-foreground">
            This is what the savings on your dashboard are worked out from. You can
            change it later, and skip it for now if you would rather.
          </p>

          <div className="mt-8">
            <SettingsForm
              settings={settings}
              quitting={quitting}
              submitLabel="Continue"
              onSaved={() => setStep("first-log")}
            />
          </div>

          <div className="mt-4 flex gap-1">
            <Button variant="ghost" onClick={() => setStep("first-log")}>
              Skip for now
            </Button>
            <Button variant="ghost" onClick={() => setStep("quitting")}>
              Back
            </Button>
          </div>
        </section>
      )}

      {step === "first-log" && (
        <section className="mt-10">
          <h1 className="text-3xl font-semibold tracking-tight">How did today go?</h1>
          <p className="mt-3 max-w-[52ch] text-muted-foreground">{FIRST_LOG_HINT[quitting]}</p>

          <form onSubmit={submitFirstLog} className="mt-8 space-y-5">
            {errorBox}

            <CountFields
              substances={tracked(quitting)}
              draft={draft}
              onChange={(next) => { setDraft(next); setError(null) }}
              idPrefix="onboarding"
              autoFocus
              hint={false}
            />

            <div className="space-y-1.5">
              <Label htmlFor="onboarding-note">
                Note <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                id="onboarding-note"
                rows={3}
                placeholder="What set it off, or what helped?"
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
