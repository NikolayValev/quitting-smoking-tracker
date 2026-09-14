import { notFound } from "next/navigation"
import { AppHeader } from "@/components/app-header"
import { DashboardView } from "@/components/dashboard-view"
import type { DashboardLog } from "@/lib/dashboard-stats"

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

  // Newest first, matching what getLogs returns.
  for (let i = 0; i < 46; i++) {
    const ts = new Date(NOW.getTime() - i * day)
    const smokeFree = ts.getTime() >= QUIT_DAY.getTime()
    logs.push({
      id: `fixture-${i}`,
      ts,
      cigarettes: smokeFree ? 0 : Math.min(15, 1 + Math.floor((i - 46) * -0.4)),
      note: i === 0 ? "Still going." : null,
    })
  }
  return logs
}

const SCREENS = {
  dashboard: {
    title: "Dashboard",
    render: () => <DashboardView logs={fixtureLogs()} now={NOW} />,
  },
  "dashboard-empty": {
    title: "Dashboard, no logs yet",
    render: () => <DashboardView logs={[]} now={NOW} />,
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
      <AppHeader currentPage="dashboard" />
      {entry.render()}
    </div>
  )
}
