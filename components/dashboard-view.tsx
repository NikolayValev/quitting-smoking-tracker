import type { ReactNode } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MilestonesDisplay } from "@/components/milestones-display"
import { DailyTip } from "@/components/daily-tip"
import { WithdrawalNote } from "@/components/withdrawal-note"
import { deriveDashboardStats } from "@/lib/dashboard-stats"
import type { WellnessTip } from "@/lib/data/wellness-tips"
import { preparationFor } from "@/lib/substance-content"
import {
  SUBSTANCE_COPY,
  seriesFor,
  tracked,
  type CheckIn,
  type Substance,
} from "@/lib/substances"
import {
  DEFAULT_CIGARETTES_PER_PACK,
  EMPTY_SETTINGS,
  formatMoney,
  toStatsSettings,
  type UserSettings,
} from "@/lib/user-settings"

const link = "font-medium text-primary underline-offset-4 hover:underline"

/** What a slip usually comes from, in the words of each substance. */
const SLIP_COPY: Record<Substance, ReactNode> = {
  cigarettes: (
    <>
      Your last check-in had cigarettes in it. Make the next one a zero, and think
      about what set this one off: a drink, a bad day, someone offering. The{" "}
      <Link href="/wellness" className={link}>
        trigger plans
      </Link>{" "}
      cover the usual ones.
    </>
  ),
  cannabis: (
    <>
      Your last check-in had cannabis in it. Make the next one a zero, and think
      about what set this one off: an empty evening, a friend offering, a bad
      night&rsquo;s sleep. The{" "}
      <Link href="/wellness" className={link}>
        trigger plans
      </Link>{" "}
      cover the usual ones.
    </>
  ),
}

/**
 * The dashboard body, given the check-ins.
 *
 * Separate from the route so it can be rendered from fixtures — with no
 * database and nobody signed in — which is the only way to look at this screen
 * while working on it. The route keeps auth and fetching.
 *
 * The hierarchy matches /demo deliberately: the streak is the headline and the
 * derived figures sit under it as quiet text. Three equal cards said a dollar
 * estimate mattered as much as the streak, which is not what anyone opens this
 * app to find out.
 *
 * Someone quitting both gets one of these per substance, one above the other.
 * They are separate quits: a slip with one does not restart the other, and
 * each has its own withdrawal on its own clock.
 */
export function DashboardView({
  checkIns,
  tip,
  now,
  settings = EMPTY_SETTINGS,
  action,
}: {
  checkIns: CheckIn[]
  /** The "log today" control. Supplied by the route so this stays renderable
   *  from fixtures, and so the control opens a dialog rather than navigating. */
  action?: ReactNode
  /** The day's wellness tip. Optional so the empty state need not pick one. */
  tip?: WellnessTip
  now?: Date
  settings?: UserSettings
}) {
  const substances = tracked(settings.quitting)

  if (checkIns.length === 0) {
    // Before the first check-in is when preparation pays off most. These are
    // the steps stop-smoking services suggest, not a generic "ready to start".
    return (
      <main className="container mx-auto max-w-2xl px-4 py-24">
        <h1 className="text-3xl font-semibold tracking-tight">Before your quit day</h1>
        <p className="mt-3 max-w-[52ch] text-muted-foreground">
          A few things done beforehand make the first week much easier.
        </p>
        <ol className="mt-6 max-w-[58ch] list-decimal space-y-2 pl-5 text-sm">
          {preparationFor(settings.quitting).map((step) => (
            <li key={step}>{step}</li>
          ))}
          <li>
            <Link href="/wellness" className={link}>
              Read the plans for your usual triggers
            </Link>
            , so the first one is not a surprise.
          </li>
        </ol>
        <Button asChild size="lg" className="mt-8">
          <Link href="/onboarding">Log your first day</Link>
        </Button>
      </main>
    )
  }

  const single = substances.length === 1

  // Health milestones are for cigarettes only. What recovers after stopping
  // cannabis, and when, is not established well enough to put dates on. They
  // come after every substance's streak, so a long list under the first does
  // not push the second off the screen.
  const cigaretteLogs = substances.includes("cigarettes") ? seriesFor(checkIns, "cigarettes") : []
  const milestonesFrom =
    cigaretteLogs.length > 0
      ? deriveDashboardStats(cigaretteLogs, now, toStatsSettings(settings)).quitDate
      : null

  return (
    <main className="container mx-auto max-w-3xl px-4 py-12 sm:py-16">
      {!single && <h1 className="sr-only">Your progress</h1>}

      {substances.map((substance, i) => (
        <SubstanceProgress
          key={substance}
          substance={substance}
          checkIns={checkIns}
          settings={settings}
          now={now}
          named={!single}
          action={i === 0 ? action : undefined}
          className={i > 0 ? "mt-16 border-t border-border/60 pt-12" : undefined}
        />
      ))}

      {milestonesFrom && (
        <div className="mt-12">
          <MilestonesDisplay
            quitDate={milestonesFrom}
            now={now}
            title={single ? "Milestones" : "Health milestones since your last cigarette"}
          />
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

/** One substance's streak, what to expect today, and what it has saved. */
function SubstanceProgress({
  substance,
  checkIns,
  settings,
  now,
  named,
  action,
  className,
}: {
  substance: Substance
  checkIns: CheckIn[]
  settings: UserSettings
  now?: Date
  /** Whether there is more than one, so each has to say which it is. Its
   *  headline is then an h2 under the page's own h1. */
  named: boolean
  action?: ReactNode
  className?: string
}) {
  const Headline = named ? "h2" : "h1"
  const copy = SUBSTANCE_COPY[substance]
  const logs = seriesFor(checkIns, substance)

  if (logs.length === 0) {
    // Just added to the quit: nothing has been recorded for it yet.
    return (
      <section className={className}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Headline className="text-3xl font-semibold tracking-tight">{copy.name}</Headline>
            <p className="mt-3 max-w-[58ch] text-muted-foreground">
              Nothing recorded yet. Your next check-in asks about it, and the streak
              starts from there.
            </p>
          </div>
          {action}
        </div>
      </section>
    )
  }

  const stats = deriveDashboardStats(logs, now, toStatsSettings(settings, substance))
  const { quitDate, smokeFreeDays, smokeFreeHours } = stats
  const perPack = settings.cigarettesPerPack || DEFAULT_CIGARETTES_PER_PACK
  const rate =
    substance === "cannabis"
      ? `${stats.baselinePerDay} ${copy.unit(stats.baselinePerDay)} a day`
      : `${stats.baselinePerDay} a day`

  return (
    <section className={className}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          {quitDate ? (
            <Headline className="text-5xl font-semibold tracking-tight sm:text-6xl">
              {smokeFreeDays.toLocaleString("en-GB")}
              <span className="ml-3 align-baseline text-xl font-normal text-muted-foreground sm:text-2xl">
                {smokeFreeDays === 1 ? "day" : "days"} {copy.free}
              </span>
            </Headline>
          ) : (
            <Headline className="text-4xl font-semibold tracking-tight">
              {named ? `${copy.name}: a slip, not the end` : "A slip, not the end"}
            </Headline>
          )}
          {quitDate ? (
            <p className="mt-3 text-muted-foreground">
              {smokeFreeHours > 0
                ? `and ${smokeFreeHours} ${smokeFreeHours === 1 ? "hour" : "hours"}`
                : "Going strong."}
            </p>
          ) : (
            // Most people who stop for good have slipped along the way; what
            // matters is the next day, and knowing what set this one off.
            <p className="mt-3 max-w-[58ch] text-muted-foreground">{SLIP_COPY[substance]}</p>
          )}
        </div>
        {action}
      </div>

      {quitDate && <WithdrawalNote smokeFreeDays={smokeFreeDays} substance={substance} />}

      <dl className="mt-10 grid grid-cols-2 gap-x-8 gap-y-6 border-t border-border/60 pt-6 sm:grid-cols-3">
        <div>
          <dt className="text-sm text-muted-foreground">Money saved</dt>
          {stats.moneySaved === null ? (
            // No price, and none worth guessing: ask rather than invent one.
            <>
              <dd className="mt-1 text-2xl font-medium text-muted-foreground">&mdash;</dd>
              <p className="mt-1 text-xs text-muted-foreground">
                <Link href="/account" className="underline underline-offset-4 hover:text-foreground">
                  Add what a session cost
                </Link>
              </p>
            </>
          ) : (
            <>
              <dd className="mt-1 text-2xl font-medium">
                {formatMoney(stats.moneySaved, settings.currency)}
              </dd>
              <p className="mt-1 text-xs text-muted-foreground">At {rate} before you quit</p>
            </>
          )}
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">{copy.notUsed}</dt>
          <dd className="mt-1 text-2xl font-medium">{stats.notUsed.toLocaleString("en-GB")}</dd>
          <p className="mt-1 text-xs text-muted-foreground">
            {stats.moneySaved === null ? `At ${rate} before you quit` : "Since your quit day"}
          </p>
        </div>
        {substance === "cigarettes" && (
          <div>
            <dt className="text-sm text-muted-foreground">Packs not bought</dt>
            <dd className="mt-1 text-2xl font-medium">
              {Math.floor(stats.notUsed / perPack).toLocaleString("en-GB")}
            </dd>
            <p className="mt-1 text-xs text-muted-foreground">At {perPack} to a pack</p>
          </div>
        )}
      </dl>

    </section>
  )
}
