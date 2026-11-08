"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { COUNT_FIELD, SUBSTANCE_COPY, type Substance } from "@/lib/substances"

/** What the person has typed, per substance, before it is parsed. */
export type CountDraft = Partial<Record<Substance, string>>

export type Counts = { cigarettes?: number; sessions?: number }

/**
 * Turns the typed counts into what the log actions take, or an error to show.
 * Every substance asked about needs an answer: a blank would otherwise be
 * stored as "not asked", which is not what leaving it empty meant.
 */
export function parseCounts(
  substances: Substance[],
  draft: CountDraft,
): { ok: true; counts: Counts; total: number } | { ok: false; error: string } {
  const counts: Counts = {}
  let total = 0
  for (const substance of substances) {
    const value = Number.parseInt(draft[substance] ?? "", 10)
    if (Number.isNaN(value) || value < 0) {
      return { ok: false, error: "Enter a number, 0 or more." }
    }
    counts[COUNT_FIELD[substance]] = value
    total += value
  }
  return { ok: true, counts, total }
}

/**
 * One number input per substance being quit, in the words of each. Shared by
 * the check-in dialog, the edit dialog and onboarding so they ask the same
 * question the same way.
 */
export function CountFields({
  substances,
  draft,
  onChange,
  idPrefix,
  autoFocus = false,
  hint = true,
}: {
  substances: Substance[]
  draft: CountDraft
  onChange: (draft: CountDraft) => void
  idPrefix: string
  autoFocus?: boolean
  /** "Enter 0 for a day without" under each field. */
  hint?: boolean
}) {
  return (
    <>
      {substances.map((substance, i) => {
        const copy = SUBSTANCE_COPY[substance]
        const id = `${idPrefix}-${substance}`
        return (
          <div key={substance} className="space-y-1.5">
            <Label htmlFor={id}>{copy.countLabel}</Label>
            <Input
              id={id}
              type="number"
              min="0"
              inputMode="numeric"
              placeholder="0"
              value={draft[substance] ?? ""}
              onChange={(e) => onChange({ ...draft, [substance]: e.target.value })}
              required
              autoFocus={autoFocus && i === 0}
            />
            {hint && (
              <p className="text-xs text-muted-foreground">
                Enter 0 for a {copy.free} day.
              </p>
            )}
          </div>
        )
      })}
    </>
  )
}
