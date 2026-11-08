import { notFound } from "next/navigation"
import type { NavKey } from "@/lib/nav"
import { AppHeader } from "@/components/app-header"
import { DashboardView } from "@/components/dashboard-view"
import type { CheckIn } from "@/lib/substances"
import { WellnessView } from "@/components/wellness-view"
import { CravingPatterns } from "@/components/craving-patterns"
import { summariseCravings, type CravingRecord } from "@/lib/cravings"
import { JourneyView } from "@/components/journey-view"
import { AccountView } from "@/components/account-view"
import { BuddiesView } from "@/components/buddies-view"
import { OnboardingFlow } from "@/components/onboarding-flow"
import { DailyLogDialog } from "@/components/daily-log-dialog"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import type { UserSettings } from "@/lib/user-settings"
import { InvitePanel } from "@/components/invite-panel"
import { wellnessTips } from "@/lib/data/wellness-tips"
import { motivationalQuotes } from "@/lib/data/motivational-quotes"
import { cannabisQuotes, cannabisTips } from "@/lib/data/cannabis"

/**
 * Dev-only preview of the signed-in screens.
 *
 * These screens are behind auth and behind a database, so there is otherwise no
 * way to look at them while working on them — which is how the nav came to be
 * missing on small screens without anyone noticing.
 *
 * It renders fixtures through the same presentational components the real
 * routes use, and touches neither Clerk nor the database, so it is a preview
 * rather than a way around authentication. Production returns 404 regardless.
 */
export const dynamic = "force-dynamic"

/** A fixed clock, so screenshots of this page do not change by the day. */
const NOW = new Date("2025-03-01T09:00:00.000Z")
const QUIT_DAY = new Date("2025-01-14T08:00:00.000Z")

const daysAgo = (n: number) => new Date(NOW.getTime() - n * 24 * 60 * 60 * 1000)

/**
 * A month of cravings with a shape to it: drinks come up most and are where
 * the one slip happened, and most arrive in the evening.
 */
const CRAVINGS: CravingRecord[] = (
  [
    // [days ago, trigger, strength, outcome, hour on their clock]
    [1, "drink", 4, "passed", 21],
    [3, "coffee", 2, "passed", 8],
    [4, "stress", 3, "passed", 18],
    [6, "drink", 5, "smoked", 22],
    [9, "after-meal", 2, "passed", 19],
    [11, "drink", 4, "passed", 20],
    [14, "coffee", 3, "passed", 9],
    [17, "stress", 4, "passed", 17],
    [20, "drink", 3, "passed", 21],
    [24, "other", 2, "passed", 15],
    [27, "coffee", 3, "passed", 8],
  ] as const
).map(([ago, trigger, strength, outcome, localHour]) => ({
  createdAt: daysAgo(ago),
  substance: "cigarettes" as const,
  trigger,
  strength,
  outcome,
  localHour,
}))

/** Cannabis cravings for someone quitting both: evenings and bedtime. */
const CANNABIS_CRAVINGS: CravingRecord[] = (
  [
    [1, "sleep", 4, "passed", 23],
    [2, "wind-down", 3, "passed", 19],
    [4, "friends", 5, "smoked", 22],
    [5, "sleep", 4, "passed", 23],
    [8, "wind-down", 2, "passed", 20],
    [12, "boredom", 3, "passed", 15],
  ] as const
).map(([ago, trigger, strength, outcome, localHour]) => ({
  createdAt: daysAgo(ago),
  substance: "cannabis" as const,
  trigger,
  strength,
  outcome,
  localHour,
}))

function fixtureLogs(): CheckIn[] {
  const logs: CheckIn[] = []
  const day = 86_400_000
  const cleanDays = Math.round((NOW.getTime() - QUIT_DAY.getTime()) / day)
  const smokingDays = 30

  // Newest first, matching what getLogs returns: the clean streak, then the
  // weeks of cutting down that came before it. The previous fixture generated
  // nothing but zeroes, so every screen using it showed a flat chart, a peak of
  // zero, and savings computed from the fallback rate rather than real history.
  for (let i = 0; i <= cleanDays; i++) {
    logs.push({
      id: `clean-${i}`,
      ts: new Date(NOW.getTime() - i * day),
      cigarettes: 0,
      sessions: null,
      note: i === 0 ? "Still going." : null,
    })
  }

  for (let i = 1; i <= smokingDays; i++) {
    logs.push({
      id: `smoking-${i}`,
      ts: new Date(QUIT_DAY.getTime() - i * day),
      // Climbs back towards fifteen a day the further back you look.
      cigarettes: Math.min(15, Math.round(i / 2) + 1),
      sessions: null,
      note: i === smokingDays ? "First day trying to cut down." : null,
    })
  }

  return logs
}

/**
 * The same days for someone who stopped cannabis instead: nine days without,
 * in the hardest stretch of it, after two or three times a day.
 */
function cannabisLogs(): CheckIn[] {
  return fixtureLogs().map((log, i) => ({
    ...log,
    cigarettes: null,
    sessions: i < 10 ? 0 : 2 + (i % 2),
    note: i === 0 ? "Slept badly again, but did not use." : null,
  }))
}

/**
 * Quitting both: the cigarette history above, and cannabis stopped alongside
 * it with a slip four days ago, so the two streaks differ.
 */
function bothLogs(): CheckIn[] {
  return fixtureLogs().map((log, i) => ({
    ...log,
    sessions: i === 4 ? 1 : (log.cigarettes ?? 0) > 0 ? 2 : 0,
    note: i === 4 ? "A party. Had one, but no cigarettes." : log.note,
  }))
}

/** A person who has finished onboarding, so money renders in a real currency. */
const SETTINGS: UserSettings = {
  quitting: "cigarettes",
  baselinePerDay: 15,
  pricePerPack: 12.5,
  cigarettesPerPack: 20,
  sessionsPerDay: null,
  pricePerSession: null,
  currency: "GBP",
}

const CANNABIS_SETTINGS: UserSettings = {
  ...SETTINGS,
  quitting: "cannabis",
  sessionsPerDay: 3,
  pricePerSession: 6,
}

/** No session price, so the dashboard's "add a price" state shows. */
const BOTH_SETTINGS: UserSettings = { ...SETTINGS, quitting: "both", sessionsPerDay: 2 }

const logToday = (
  <Button className="shrink-0 gap-1.5">
    <PlusCircle className="h-4 w-4" />
    Log today
  </Button>
)

const SCREENS = {
  dashboard: {
    title: "Dashboard",
    render: () => (
      <DashboardView
        checkIns={fixtureLogs()}
        tip={wellnessTips[0]}
        now={NOW}
        settings={SETTINGS}
        action={<DailyLogDialog trigger={logToday} />}
      />
    ),
  },
  "dashboard-slip": {
    title: "Dashboard, last check-in had cigarettes",
    render: () => (
      <DashboardView
        checkIns={[
          { id: "slip", ts: daysAgo(1), cigarettes: 3, sessions: null },
          ...fixtureLogs().slice(1),
        ]}
        now={NOW}
        settings={SETTINGS}
        action={<DailyLogDialog trigger={logToday} />}
      />
    ),
  },
  "dashboard-empty": {
    title: "Dashboard, no logs yet",
    render: () => <DashboardView checkIns={[]} now={NOW} />,
  },
  "dashboard-cannabis": {
    title: "Dashboard, quitting cannabis",
    render: () => (
      <DashboardView
        checkIns={cannabisLogs()}
        tip={cannabisTips[0]}
        now={NOW}
        settings={CANNABIS_SETTINGS}
        action={<DailyLogDialog quitting="cannabis" trigger={logToday} />}
      />
    ),
  },
  "dashboard-both": {
    title: "Dashboard, quitting both",
    render: () => (
      <DashboardView
        checkIns={bothLogs()}
        now={NOW}
        settings={BOTH_SETTINGS}
        action={<DailyLogDialog quitting="both" trigger={logToday} />}
      />
    ),
  },
  journey: {
    title: "Journey",
    render: () => (
      <JourneyView
        editable
        entries={fixtureLogs()}
        intro="Every check-in you have logged, and the shape they make."
        now={NOW}
        cravings={<CravingPatterns summary={summariseCravings(CRAVINGS, NOW)} />}
      />
    ),
  },
  "journey-no-cravings": {
    title: "Journey, no cravings recorded",
    render: () => (
      <JourneyView
        editable
        entries={fixtureLogs()}
        intro="Every check-in you have logged, and the shape they make."
        now={NOW}
        cravings={<CravingPatterns summary={null} />}
      />
    ),
  },
  "journey-both": {
    title: "Journey, quitting both",
    render: () => (
      <JourneyView
        editable
        entries={bothLogs()}
        quitting="both"
        intro="Every check-in you have logged, and the shape they make."
        now={NOW}
        cravings={
          <>
            <CravingPatterns
              named
              substance="cigarettes"
              summary={summariseCravings(CRAVINGS, NOW)}
            />
            <CravingPatterns
              named
              substance="cannabis"
              summary={summariseCravings(CANNABIS_CRAVINGS, NOW)}
            />
          </>
        }
      />
    ),
  },
  account: {
    title: "Account",
    render: () => (
      <AccountView name="Sam Rivera" email="sam@example.com" settings={SETTINGS} checkinReminder />
    ),
  },
  "account-both": {
    title: "Account, quitting both",
    render: () => (
      <AccountView
        name="Sam Rivera"
        email="sam@example.com"
        settings={{ ...BOTH_SETTINGS, pricePerSession: 5 }}
        checkinReminder={false}
      />
    ),
  },
  buddies: {
    title: "Buddies",
    render: () => (
      <BuddiesView
        buddies={[
          { linkId: "a", name: "Priya Raman", state: "active", role: "sponsor" },
          { linkId: "d", name: "Jonas Weber", state: "active", role: "buddy" },
          { linkId: "b", name: null, state: "pending", role: "buddy" },
        ]}
        supporting={[
          {
            linkId: "c",
            name: "Tom Okafor",
            state: "active",
            role: "sponsor",
            summary: {
              smokeFreeDays: 3,
              milestonesReached: 6,
              milestoneCount: 13,
              lastSlipOn: "2025-02-25",
              slipDaysRecent: 2,
            },
            askedForHelp: "2 hours ago",
          },
          {
            linkId: "e",
            name: "Mei Lin",
            state: "active",
            role: "buddy",
            summary: { smokeFreeDays: 212, milestonesReached: 10, milestoneCount: 13 },
          },
        ]}
        cheers={[
          { id: "s1", name: "Priya Raman", kind: "proud", when: "yesterday" },
          { id: "s2", name: "Jonas Weber", kind: "keep_going", when: "3 days ago" },
        ]}
      />
    ),
  },
  onboarding: {
    title: "Onboarding",
    // The real route has no app header — it is reached before there is anything
    // to navigate to. A preview that adds one is not a preview of it.
    chrome: false,
    render: () => (
      <OnboardingFlow
        settings={{
          quitting: "cigarettes",
          baselinePerDay: null,
          pricePerPack: null,
          cigarettesPerPack: 20,
          sessionsPerDay: null,
          pricePerSession: null,
          currency: "GBP",
        }}
      />
    ),
  },
  "buddies-invite": {
    title: "Buddies, invite created",
    render: () => (
      <main className="container mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-3xl font-semibold tracking-tight">Buddies</h1>
        <InvitePanel code="7KQ2MBXN4TVCJ3HRGPWD" origin="https://smoking.nikolayvalev.com" />
      </main>
    ),
  },
  "buddies-invite-sponsor": {
    title: "Buddies, sponsor invite created",
    render: () => (
      <main className="container mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-3xl font-semibold tracking-tight">Buddies</h1>
        <InvitePanel
          code="7KQ2MBXN4TVCJ3HRGPWD"
          origin="https://smoking.nikolayvalev.com"
          role="sponsor"
        />
      </main>
    ),
  },
  "buddies-empty": {
    title: "Buddies, none yet",
    render: () => <BuddiesView buddies={[]} supporting={[]} />,
  },
  wellness: {
    title: "Wellness",
    // Fixed picks rather than pickForToday, so the screen is the same shot to
    // shot instead of rotating with the date.
    render: () => (
      <WellnessView quote={motivationalQuotes[0]} tip={wellnessTips[0]} />
    ),
  },
  "wellness-craving": {
    title: "Wellness, a craving plan open",
    render: () => (
      <WellnessView quote={motivationalQuotes[0]} tip={wellnessTips[0]} openPlan="drink" />
    ),
  },
  "wellness-cannabis": {
    title: "Wellness, quitting cannabis",
    render: () => (
      <WellnessView quote={cannabisQuotes[0]} tip={cannabisTips[0]} quitting="cannabis" />
    ),
  },
  "wellness-both": {
    title: "Wellness, quitting both, a cannabis plan open",
    render: () => (
      <WellnessView
        quote={cannabisQuotes[0]}
        tip={cannabisTips[1]}
        quitting="both"
        openPlan="sleep"
      />
    ),
  },
} as const

type Screen = keyof typeof SCREENS

export function generateStaticParams() {
  return Object.keys(SCREENS).map((screen) => ({ screen }))
}

export default async function DevPreviewPage({
  params,
}: {
  params: Promise<{ screen: string }>
}) {
  if (process.env.NODE_ENV === "production") notFound()

  const { screen } = await params
  const entry = SCREENS[screen as Screen]
  if (!entry) notFound()

  const chrome = (entry as { chrome?: boolean }).chrome !== false

  return (
    <div className="min-h-screen bg-background">
      {chrome && (
        <AppHeader
          currentPage={
            // By prefix, so "buddies-empty" and "wellness-craving" light up
            // their own section rather than the dashboard.
            (["wellness", "journey", "account", "buddies"].find(
              (page) => screen === page || screen.startsWith(`${page}-`),
            ) ?? "dashboard") as NavKey
          }
        />
      )}
      {entry.render()}
    </div>
  )
}
