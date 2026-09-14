import Link from "next/link"
import { PlusCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MilestonesDisplay } from "@/components/milestones-display"
import { deriveDashboardStats, type DashboardLog } from "@/lib/dashboard-stats"

/**
 * The dashboard body, given a log list.
 *
 * Separate from the route so it can be rendered from fixtures — with no
 * database and nobody signed in — which is the only way to look at this screen
 * while working on it. The route keeps auth and fetching.
 *
 * The hierarchy matches /demo deliberately: the streak is the headline and the
 * derived figures sit under it as quiet text. Three equal cards said a dollar
 * estimate mattered as much as the streak, which is not what anyone opens this
 * app to find out.
 */
export function DashboardView({
  logs,
  now,
}: {
  logs: DashboardLog[]
  now?: Date
}) {
  const stats = deriveDashboardStats(logs, now)

  if (logs.length === 0) {
    return (
      <main className="container mx-auto max-w-2xl px-4 py-24">
        <h1 className="text-3xl font-semibold tracking-tight">Ready to start?</h1>
        <p className="mt-3 max-w-[52ch] text-muted-foreground">
          Log your first day to begin tracking. One check-in is enough to start a streak.
        </p>
        <Button asChild size="lg" className="mt-6">
          <Link href="/onboarding">Log your first day</Link>
        </Button>
      </main>
    )
  }

  const { quitDate, smokeFreeDays, smokeFreeHours } = stats

  return (
    <main className="container mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          {quitDate ? (
            <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl">
              {smokeFreeDays.toLocaleString("en-GB")}
              <span className="ml-3 align-baseline text-xl font-normal text-muted-foreground sm:text-2xl">
                {smokeFreeDays === 1 ? "day smoke-free" : "days smoke-free"}
              </span>
            </h1>
          ) : (
            <h1 className="text-4xl font-semibold tracking-tight">Your journey</h1>
          )}
          <p className="mt-3 text-muted-foreground">
            {quitDate
              ? smokeFreeHours > 0
                ? `and ${smokeFreeHours} ${smokeFreeHours === 1 ? "hour" : "hours"}`
                : "Going strong."
              : "Log a smoke-free day to start your counter."}
          </p>
        </div>
        <Button asChild className="shrink-0">
          <Link href="/onboarding" className="flex items-center gap-1.5">
            <PlusCircle className="h-4 w-4" />
            Log today
          </Link>
        </Button>
      </div>

      <dl className="mt-10 grid grid-cols-2 gap-x-8 gap-y-6 border-t border-border/60 pt-6 sm:grid-cols-3">
        <div>
          <dt className="text-sm text-muted-foreground">Money saved</dt>
          <dd className="mt-1 text-2xl font-medium">
            ${stats.moneySaved.toFixed(2)}
          </dd>
          <p className="mt-1 text-xs text-muted-foreground">
            At {stats.baselinePerDay} a day before you quit
          </p>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Cigarettes not smoked</dt>
          <dd className="mt-1 text-2xl font-medium">
            {stats.cigarettesNotSmoked.toLocaleString("en-GB")}
          </dd>
          <p className="mt-1 text-xs text-muted-foreground">Since your quit day</p>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Days tracked</dt>
          <dd className="mt-1 text-2xl font-medium">{stats.daysTracked}</dd>
          <p className="mt-1 text-xs text-muted-foreground">
            {quitDate ? "Every check-in counts" : "Keep tracking"}
          </p>
        </div>
      </dl>

      {quitDate && (
        <div className="mt-12">
          <MilestonesDisplay quitDate={quitDate} now={now} />
        </div>
      )}
    </main>
  )
}
