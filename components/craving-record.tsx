"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { recordCraving } from "@/app/wellness/actions"
import {
  CRAVING_STRENGTHS,
  type CravingOutcome,
  type CravingTrigger,
} from "@/lib/cravings"
import { SUBSTANCE_COPY, type Substance } from "@/lib/substances"

/**
 * Records one craving: how strong it was and whether it passed. The trigger is
 * already known from the plan the person opened.
 *
 * Two taps and no typing, because the person using it is mid-craving or just
 * out of one. Recording is optional; the plan above it works without.
 */
export function CravingRecord({
  trigger,
  substance = "cigarettes",
}: {
  trigger: CravingTrigger
  substance?: Substance
}) {
  const [strength, setStrength] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [recorded, setRecorded] = useState<CravingOutcome | null>(null)
  const [error, setError] = useState<string | null>(null)

  const save = async (outcome: CravingOutcome) => {
    if (strength === null) return
    setSaving(true)
    setError(null)
    try {
      const result = await recordCraving({
        substance,
        trigger,
        strength,
        outcome,
        // Their clock, not the server's: see the cravings table.
        localHour: new Date().getHours(),
      })
      if (result.success) setRecorded(outcome)
      else setError(result.error)
    } catch {
      setError("Could not record the craving.")
    } finally {
      setSaving(false)
    }
  }

  if (recorded) {
    return (
      <div className="mt-8 border-t border-border/60 pt-6" role="status">
        {recorded === "passed" ? (
          <p className="text-sm">
            Recorded. Patterns build up on your{" "}
            <Link href="/app" className="font-medium underline underline-offset-4">
              journey page
            </Link>
            .
          </p>
        ) : (
          <p className="max-w-[58ch] text-sm">
            Recorded. {substance === "cannabis" ? "Using once" : "One cigarette"} is a slip,
            not the end of the quit. Put it in today&rsquo;s check-in, and carry on from here.
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="mt-8 border-t border-border/60 pt-6">
      <h3 className="text-sm font-medium">Record this craving</h3>
      <p className="mt-1 max-w-[58ch] text-sm text-muted-foreground">
        Over a few weeks, these show which moments are hardest. Only you see them.
      </p>

      <p id="craving-strength" className="mt-5 text-sm text-muted-foreground">
        How strong was it?
      </p>
      {/* Shrink-wrapped so the end labels sit under the end buttons. */}
      <div className="mt-2 inline-flex flex-col">
        <div role="radiogroup" aria-labelledby="craving-strength" className="flex gap-2">
          {CRAVING_STRENGTHS.map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={strength === value}
              onClick={() => setStrength(value)}
              className={`h-11 w-11 rounded-lg border text-sm font-medium tabular-nums transition-colors ${
                strength === value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border/60 hover:border-border hover:bg-muted/40"
              }`}
            >
              {value}
            </button>
          ))}
        </div>
        <div aria-hidden className="mt-1.5 flex justify-between text-xs text-muted-foreground">
          <span>Mild</span>
          <span>Overwhelming</span>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button onClick={() => save("passed")} disabled={strength === null || saving}>
          It passed
        </Button>
        <Button
          variant="outline"
          onClick={() => save("smoked")}
          disabled={strength === null || saving}
        >
          {SUBSTANCE_COPY[substance].gaveIn}
        </Button>
      </div>

      {error && (
        <p className="mt-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
