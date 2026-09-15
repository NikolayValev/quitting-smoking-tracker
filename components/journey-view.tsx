import type { ReactNode } from "react"
import { CheckCircle2 } from "lucide-react"
import { JourneyChart, type JourneyPoint } from "@/components/journey-chart"
import { CheckInActions } from "@/components/check-in-actions"
import { deriveDashboardStats, type DashboardLog } from "@/lib/dashboard-stats"

export type JourneyEntry = DashboardLog

type Row =
  | { kind: "entry"; entry: JourneyEntry }
  | { kind: "run"; count: number; from: Date; to: Date }

/**
 * Collapses unbroken runs of unremarked smoke-free days into one row.
 *
 * Forty-six consecutive lines reading "Smoke-free" is not a log, it is
 * wallpaper — and it buries the days that actually differ. A day carrying a
 * note always survives as its own row, so nothing anyone wrote is lost.
 */
function toRows(entries: JourneyEntry[]): Row[] {
  const rows: Row[] = []

  for (const entry of entries) {
    const plain = entry.cigarettes === 0 && !entry.note
    const last = rows[rows.length - 1]

    if (plain && last?.kind === "run") {
      last.count += 1
      last.from = new Date(entry.ts)
      continue
    }
    if (plain) {
      rows.push({ kind: "run", count: 1, from: new Date(entry.ts), to: new Date(entry.ts) })
      continue
    }
    rows.push({ kind: "entry", entry })
  }

  // A run of one says nothing a plain row does not.
  return rows.map((row) =>
    row.kind === "run" && row.count === 1
      ? {
          kind: "entry" as const,
          entry: entries.find((e) => new Date(e.ts).getTime() === row.to.getTime())!,
        }
      : row,
  )
}

const shortDate = (d: Date) =>
  d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })

const longDate = (d: Date) =>
  d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })

/**
 * A whole quitting history: the streak, the curve, and every check-in.
 *
 * Shared by /demo and the signed-in journey. They were separate copies of the
 * same screen, which is why only one of them got fixed — the demo lost its
 * nested scroller and gained the chart while the real one, which nobody could
 * see, kept both faults.
 *
 * Entries arrive newest first, the order getLogs returns.
 */
export function JourneyView({
  entries,
  intro,
  action,
  now,
  editable = false,
  children,
}: {
  entries: JourneyEntry[]
  intro?: ReactNode
  action?: ReactNode
  now?: Date
  /** Whether these entries belong to the person reading them. The demo shows
   *  the same list to a stranger and must stay read-only. */
  editable?: boolean
  /** Rendered after the check-ins, for whatever the page wants to add. */
  children?: ReactNode
}) {
  const stats = deriveDashboardStats(entries, now)
  const at = (e: JourneyEntry) => new Date(e.ts)

  // The chart reads left to right in time; the list reads newest first, which
  // is what a log is for.
  const chartData: JourneyPoint[] = [...entries]
    .sort((a, b) => at(a).getTime() - at(b).getTime())
    .map((e) => ({ t: at(e).getTime(), cigarettes: e.cigarettes }))

  const peak = Math.max(...entries.map((e) => e.cigarettes), 0)
  const started = at(entries[entries.length - 1])

  // The page container lives here rather than in each route: it was duplicated
  // in two callers and the preview, and the preview had it wrong.
  return (
    <main className="container mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl">
            {stats.smokeFreeDays > 0 ? stats.smokeFreeDays.toLocaleString("en-GB") : "—"}
            <span className="ml-3 align-baseline text-xl font-normal text-muted-foreground sm:text-2xl">
              days smoke-free
            </span>
          </h1>
          {intro && <div className="mt-4 max-w-[58ch] text-muted-foreground">{intro}</div>}
        </div>
        {action}
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-medium text-muted-foreground">Cigarettes a day</h2>
        <div className="mt-3">
          <JourneyChart
            data={chartData}
            quitAt={stats.quitDate ? stats.quitDate.getTime() : null}
          />
        </div>
      </section>

      <section className="mt-10 grid grid-cols-2 gap-x-8 gap-y-6 border-t border-border/60 pt-6 sm:grid-cols-3">
        <div>
          <dt className="text-sm text-muted-foreground">Started</dt>
          <dd className="mt-1 text-base font-medium">{longDate(started)}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Check-ins</dt>
          <dd className="mt-1 text-base font-medium">{entries.length}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Most in a day</dt>
          <dd className="mt-1 text-base font-medium">{peak}</dd>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-sm font-medium text-muted-foreground">Check-ins</h2>

        {/* A continuous spine rather than a fixed-height scroller. The old card
            capped this at 560px and produced a second scrollbar inside the
            page, which is awkward on a phone and hid most of the history. */}
        <ol className="mt-4">
          {toRows(entries).map((row, i, all) => {
            const isLast = i === all.length - 1
            const spine = !isLast && (
              <span
                aria-hidden
                className="absolute left-[7px] top-5 h-full w-px bg-border"
              />
            )

            if (row.kind === "run") {
              return (
                <li
                  key={`run-${row.to.getTime()}`}
                  className="relative flex gap-4 pb-6 last:pb-0"
                >
                  {spine}
                  <span
                    aria-hidden
                    className="relative mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-primary bg-background"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-medium">
                      {row.count} days smoke-free
                    </span>
                    <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
                      {shortDate(row.from)} &ndash; {shortDate(row.to)}
                    </p>
                  </div>
                </li>
              )
            }

            const { entry } = row
            const date = at(entry)
            const isClean = entry.cigarettes === 0
            const isQuitDay =
              stats.quitDate !== null && date.getTime() === stats.quitDate.getTime()

            return (
              <li key={entry.id} className="relative flex gap-4 pb-6 last:pb-0">
                {spine}
                <span
                  aria-hidden
                  className={
                    isClean
                      ? "relative mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-primary bg-background"
                      : "relative mt-2 ml-[3px] h-2 w-2 shrink-0 rounded-full bg-border"
                  }
                />

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="text-sm font-medium">
                      {isClean ? "Smoke-free" : `${entry.cigarettes} cigarettes`}
                    </span>
                    <time
                      dateTime={date.toISOString()}
                      className="text-xs tabular-nums text-muted-foreground"
                    >
                      {shortDate(date)}
                    </time>
                    {isQuitDay && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        <CheckCircle2 className="h-3 w-3" />
                        Quit day
                      </span>
                    )}
                  </div>
                  {entry.note && (
                    <p className="mt-1 max-w-[62ch] text-sm text-muted-foreground">
                      {entry.note}
                    </p>
                  )}
                </div>

                {editable && (
                  <CheckInActions
                    id={entry.id}
                    date={shortDate(date)}
                    cigarettes={entry.cigarettes}
                    note={entry.note ?? null}
                  />
                )}
              </li>
            )
          })}
        </ol>
      </section>

      {children}
    </main>
  )
}
