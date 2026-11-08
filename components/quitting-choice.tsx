"use client"

import { QUITTING, type Quitting } from "@/lib/substances"

const OPTIONS: Record<Quitting, { label: string; hint: string }> = {
  cigarettes: { label: "Cigarettes", hint: "Or rolling tobacco" },
  cannabis: { label: "Cannabis", hint: "However you take it" },
  // Common enough to name: joints are often rolled with tobacco, and
  // stopping one can lean on the other.
  both: { label: "Both", hint: "Tracked separately" },
}

/**
 * Cigarettes, cannabis or both, as three tappable options. Native radios
 * underneath, so it is a real radio group to a screen reader and the arrow
 * keys move between options.
 */
export function QuittingChoice({
  value,
  onChange,
  name = "quitting",
  label = "What are you quitting?",
}: {
  value: Quitting
  onChange: (value: Quitting) => void
  name?: string
  label?: string
}) {
  return (
    <fieldset>
      <legend className="text-sm font-medium">{label}</legend>
      <div className="mt-2 grid gap-2 sm:grid-cols-3">
        {QUITTING.map((option) => (
          <label
            key={option}
            className="flex cursor-pointer items-start gap-3 rounded-lg border border-border/60 px-4 py-3 transition-colors hover:border-border has-[:checked]:border-primary has-[:checked]:bg-primary/5 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring"
          >
            <input
              type="radio"
              name={name}
              value={option}
              checked={value === option}
              onChange={() => onChange(option)}
              className="mt-1 accent-[var(--primary)]"
            />
            <span>
              <span className="block text-sm font-medium">{OPTIONS[option].label}</span>
              <span className="block text-xs text-muted-foreground">{OPTIONS[option].hint}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
