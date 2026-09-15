import { notFound } from "next/navigation"
import type { NavKey } from "@/lib/nav"
import { AppHeader } from "@/components/app-header"
import { DashboardView } from "@/components/dashboard-view"
import type { DashboardLog } from "@/lib/dashboard-stats"
import { WellnessView } from "@/components/wellness-view"
import { JourneyView } from "@/components/journey-view"
import { AccountView } from "@/components/account-view"
import { wellnessTips } from "@/lib/data/wellness-tips"
import { motivationalQuotes } from "@/lib/data/motivational-quotes"

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

function fixtureLogs(): DashboardLog[] {
  const logs: DashboardLog[] = []
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
      note: i === 0 ? "Still going." : null,
    })
  }

  for (let i = 1; i <= smokingDays; i++) {
    logs.push({
      id: `smoking-${i}`,
      ts: new Date(QUIT_DAY.getTime() - i * day),
      // Climbs back towards fifteen a day the further back you look.
      cigarettes: Math.min(15, Math.round(i / 2) + 1),
      note: i === smokingDays ? "First day trying to cut down." : null,
    })
  }

  return logs
}

const SCREENS = {
  dashboard: {
    title: "Dashboard",
    render: () => <DashboardView logs={fixtureLogs()} tip={wellnessTips[0]} now={NOW} />,
  },
  "dashboard-empty": {
    title: "Dashboard, no logs yet",
    render: () => <DashboardView logs={[]} now={NOW} />,
  },
  journey: {
    title: "Journey",
    render: () => (
      <JourneyView
        entries={fixtureLogs()}
        intro="Every check-in you have logged, and the shape they make."
        now={NOW}
      />
    ),
  },
  account: {
    title: "Account",
    render: () => <AccountView name="Sam Rivera" email="sam@example.com" />,
  },
  wellness: {
    title: "Wellness",
    // Fixed picks rather than pickForToday, so the screen is the same shot to
    // shot instead of rotating with the date.
    render: () => (
      <WellnessView quote={motivationalQuotes[0]} tip={wellnessTips[0]} />
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

  return (
    <div className="min-h-screen bg-background">
      <AppHeader currentPage={(["wellness", "journey", "account"].includes(screen) ? screen : "dashboard") as NavKey} />
      {entry.render()}
    </div>
  )
}
