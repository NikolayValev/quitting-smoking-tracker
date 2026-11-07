import Link from "next/link"
import { triggerLabel, type CravingSummary, type TimeOfDay } from "@/lib/cravings"

const PERIOD: Record<TimeOfDay, string> = {
  morning: "Mornings",
  afternoon: "Afternoons",
  evening: "Evenings",
  night: "At night",
}

/**
 * What the last month of recorded cravings adds up to: how many passed, and
 * the moments they come from. The point is the trigger list. Knowing that most
 * cravings come with a drink tells someone where to plan, which a count of
 * cravings never does.
 *
 * Plain rows and numbers rather than a chart: there are at most eight
 * triggers, and a sorted list already reads as a ranking.
 */
export function CravingPatterns({ summary }: { summary: CravingSummary | null }) {
  return (
    <section className="mt-12">
      <h2 className="text-sm font-medium text-muted-foreground">Cravings, last 30 days</h2>

      {!summary ? (
        <p className="mt-3 max-w-[58ch] text-sm text-muted-foreground">
          None recorded. When one hits, open{" "}
          <Link href="/wellness" className="font-medium text-foreground underline underline-offset-4">
            Wellness
          </Link>
          , pick the moment, and record it at the end. After a few, this shows which
          moments are hardest.
        </p>
      ) : (
        <>
          <dl className="mt-4 grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-3">
            <div>
              <dt className="text-sm text-muted-foreground">Recorded</dt>
              <dd className="mt-1 text-base font-medium tabular-nums">{summary.total}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Passed</dt>
              <dd className="mt-1 text-base font-medium tabular-nums">
                {summary.passed}
                <span className="font-normal text-muted-foreground"> of {summary.total}</span>
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Hardest</dt>
              <dd className="mt-1 text-base font-medium">
                {summary.busiest ? PERIOD[summary.busiest] : "No one time"}
              </dd>
            </div>
          </dl>

          <ol className="mt-6 divide-y divide-border/60 border-y border-border/60">
            {summary.triggers.map(({ trigger, count, passed }) => (
              <li key={trigger} className="flex items-baseline justify-between gap-4 py-3">
                <span className="text-sm font-medium">{triggerLabel(trigger)}</span>
                <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                  {count} {count === 1 ? "time" : "times"}
                  {passed < count && ` · ${count - passed} smoked`}
                </span>
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  )
}
