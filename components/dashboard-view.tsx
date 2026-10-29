import type { ReactNode } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MilestonesDisplay } from "@/components/milestones-display"
import { DailyTip } from "@/components/daily-tip"
import { WithdrawalNote } from "@/components/withdrawal-note"
import { deriveDashboardStats, type DashboardLog } from "@/lib/dashboard-stats"
import type { WellnessTip } from "@/lib/data/wellness-tips"
import {
  DEFAULT_CIGARETTES_PER_PACK,
  EMPTY_SETTINGS,
  formatMoney,
  toStatsSettings,
  type UserSettings,
} from "@/lib/user-settings"

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
  tip,
  now,
  settings = EMPTY_SETTINGS,
  action,
}: {
  logs: DashboardLog[]
  /** The "log today" control. Supplied by the route so this stays renderable
   *  from fixtures, and so the control opens a dialog rather than navigating. */
  action?: ReactNode
  /** The day's wellness tip. Optional so the empty state need not pick one. */
  tip?: WellnessTip
  now?: Date
  settings?: UserSettings
}) {
  const stats = deriveDashboardStats(logs, now, toStatsSettings(settings))

  if (logs.length === 0) {
    // Before the first check-in is when preparation pays off most. These are
    // the steps stop-smoking services suggest, not a generic "ready to start".
    return (
      <main className="container mx-auto max-w-2xl px-4 py-24">
        <h1 className="text-3xl font-semibold tracking-tight">Before your quit day</h1>
        <p className="mt-3 max-w-[52ch] text-muted-foreground">
          A few things done beforehand make the first week much easier.
        </p>
        <ol className="mt-6 max-w-[58ch] list-decimal space-y-2 pl-5 text-sm">
          <li>Pick a day in the next two weeks, ideally not one you expect to be stressful.</li>
          <li>Tell the people around you, and ask smokers not to offer you one.</li>
          <li>Get nicotine replacement in before the day: a patch, plus gum or lozenges.</li>
          <li>The night before, get rid of every cigarette, lighter and ashtray.</li>
          <li>
            <Link href="/wellness" className="font-medium text-primary underline-offset-4 hover:underline">
              Read the plans for your usual triggers
            </Link>
            , so the first coffee is not a surprise.
          </li>
        </ol>
        <Button asChild size="lg" className="mt-8">
          <Link href="/onboarding">Log your first day</Link>
        </Button>
      </main>
    )
  }

  const { quitDate, smokeFreeDays, smokeFreeHours } = stats
  const packsNotBought = Math.floor(
    stats.cigarettesNotSmoked / (settings.cigarettesPerPack || DEFAULT_CIGARETTES_PER_PACK),
  )

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
            <h1 className="text-4xl font-semibold tracking-tight">A slip, not the end</h1>
          )}
          {quitDate ? (
            <p className="mt-3 text-muted-foreground">
              {smokeFreeHours > 0
                ? `and ${smokeFreeHours} ${smokeFreeHours === 1 ? "hour" : "hours"}`
                : "Going strong."}
            </p>
          ) : (
            // The last check-in had cigarettes in it. Most people who stop for
            // good have slipped along the way; what matters is the next day,
            // and knowing what set this one off.
            <p className="mt-3 max-w-[58ch] text-muted-foreground">
              Your last check-in had cigarettes in it. Make the next one a zero, and think
              about what set this one off: a drink, a bad day, someone offering. The{" "}
              <Link href="/wellness" className="font-medium text-primary underline-offset-4 hover:underline">
                trigger plans
              </Link>{" "}
              cover the usual ones.
            </p>
          )}
        </div>
        {action}
      </div>

      {quitDate && <WithdrawalNote smokeFreeDays={smokeFreeDays} />}

      <dl className="mt-10 grid grid-cols-2 gap-x-8 gap-y-6 border-t border-border/60 pt-6 sm:grid-cols-3">
        <div>
          <dt className="text-sm text-muted-foreground">Money saved</dt>
          <dd className="mt-1 text-2xl font-medium">
            {formatMoney(stats.moneySaved, settings.currency)}
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
          <dt className="text-sm text-muted-foreground">Packs not bought</dt>
          <dd className="mt-1 text-2xl font-medium">{packsNotBought.toLocaleString("en-GB")}</dd>
          <p className="mt-1 text-xs text-muted-foreground">
            Of {settings.cigarettesPerPack || DEFAULT_CIGARETTES_PER_PACK}
          </p>
        </div>
      </dl>

      {quitDate && (
        <div className="mt-12">
          <MilestonesDisplay quitDate={quitDate} now={now} />
        </div>
      )}

      {tip && (
        <div className="mt-12 border-t border-border/60 pt-8">
          <DailyTip tip={tip} />
        </div>
      )}
    </main>
  )
}
