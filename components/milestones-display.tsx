import { Check } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { milestoneDefinitions } from "@/lib/data/wellness-tips"
import { MilestoneTracker } from "@/components/milestone-tracker"

const MINUTE = 1
const HOUR = 60
const DAY = 24 * HOUR

/** Minutes smoke-free at which each milestone is reached. */
const THRESHOLDS: Record<string, number> = {
  "20_minutes": 20 * MINUTE,
  "12_hours": 12 * HOUR,
  "24_hours": 1 * DAY,
  "48_hours": 2 * DAY,
  "72_hours": 3 * DAY,
  "1_week": 7 * DAY,
  "2_weeks": 14 * DAY,
  "1_month": 30 * DAY,
  "3_months": 90 * DAY,
  "6_months": 180 * DAY,
  "1_year": 365 * DAY,
  "5_years": 5 * 365 * DAY,
  "10_years": 10 * 365 * DAY,
}

/** Minutes to a single, roughly-worded unit: "3 months", "12 days", "5 hours". */
function humanise(minutes: number): string {
  const plural = (n: number, unit: string) => `${n} ${unit}${n === 1 ? "" : "s"}`
  if (minutes >= 365 * DAY) return plural(Math.round(minutes / (365 * DAY)), "year")
  if (minutes >= 30 * DAY) return plural(Math.round(minutes / (30 * DAY)), "month")
  if (minutes >= DAY) return plural(Math.round(minutes / DAY), "day")
  if (minutes >= HOUR) return plural(Math.round(minutes / HOUR), "hour")
  return plural(Math.max(1, Math.round(minutes)), "minute")
}

/**
 * Health milestones, past and next.
 *
 * The previous version listed all thirteen as identical bordered cards, which
 * filled most of the dashboard with things the reader had already done and gave
 * the one they were working towards no more weight than the rest. Now the next
 * milestone is the only framed element, with progress since the last one, and
 * the reached ones are a quiet list underneath.
 *
 * `now` is a parameter rather than read from the clock so the screen can be
 * rendered at a fixed moment — otherwise every screenshot of it differs and it
 * cannot be checked.
 */
export function MilestonesDisplay({
  quitDate,
  now = new Date(),
}: {
  quitDate: Date
  now?: Date
}) {
  const elapsed = Math.max(0, Math.floor((now.getTime() - quitDate.getTime()) / 60000))

  const reached = milestoneDefinitions.filter(
    (m) => elapsed >= (THRESHOLDS[m.type] ?? Number.POSITIVE_INFINITY),
  )
  const next = milestoneDefinitions.find(
    (m) => elapsed < (THRESHOLDS[m.type] ?? Number.POSITIVE_INFINITY),
  )

  // Progress runs from the previous milestone to the next, not from zero: at
  // eighteen months, "most of the way to five years" is both truer and more
  // encouraging than "a third of the way".
  const previousThreshold = reached.length
    ? THRESHOLDS[reached[reached.length - 1].type]
    : 0
  const nextThreshold = next ? THRESHOLDS[next.type] : 0
  const span = nextThreshold - previousThreshold
  const progress = next && span > 0
    ? Math.min(100, Math.max(0, ((elapsed - previousThreshold) / span) * 100))
    : 100

  return (
    <section>
      <MilestoneTracker achieved={reached.map((m) => m.type)} />

      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-sm font-medium text-muted-foreground">Milestones</h2>
        <p className="text-sm text-muted-foreground">
          {reached.length} of {milestoneDefinitions.length} reached
        </p>
      </div>

      {next ? (
        <div className="mt-3 rounded-xl border border-primary/25 bg-primary/5 p-5">
          <h3 className="text-lg font-medium tracking-tight">
            Next: {next.label.toLowerCase()}
          </h3>
          <p className="mt-1 max-w-[52ch] text-sm text-muted-foreground">
            {next.description}
          </p>
          <Progress value={progress} className="mt-4 h-1.5" />
          <p className="mt-2 text-xs text-muted-foreground">
            {humanise(nextThreshold - elapsed)} to go
          </p>
        </div>
      ) : (
        <p className="mt-3 text-base">
          Every milestone reached. Nothing left to wait for.
        </p>
      )}

      {reached.length > 0 && (
        <ul className="mt-6 divide-y divide-border/60 border-t border-border/60">
          {reached.map((milestone) => (
            <li
              key={milestone.type}
              className="flex items-baseline gap-3 py-2.5 text-sm"
            >
              <Check className="h-3.5 w-3.5 shrink-0 translate-y-0.5 text-primary" aria-hidden />
              <span className="w-24 shrink-0 font-medium">
                {milestone.label.toLowerCase()}
              </span>
              <span className="text-muted-foreground">{milestone.description}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
