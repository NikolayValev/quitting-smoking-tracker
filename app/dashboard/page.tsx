import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { getLogs } from "@/app/app/actions"
import { AppHeader } from "@/components/app-header"
import { DashboardView } from "@/components/dashboard-view"
import { DailyLogDialog } from "@/components/daily-log-dialog"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { deriveDashboardStats } from "@/lib/dashboard-stats"
import { pickForToday } from "@/lib/daily"
import { wellnessTips } from "@/lib/data/wellness-tips"
import { getOrCreateUser } from "@/lib/auth/getOrCreateUser"
import { getUserSettings } from "@/lib/user-settings.server"
import type { Metadata } from "next"

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Dashboard - Quit Smoking Tracker",
  description: "Track your smoke-free progress, view milestones, and access wellness tools",
}

export default async function DashboardPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect("/sign-in")
  }

  const result = await getLogs()
  const logs = result.success ? result.data ?? [] : []

  const settings = await getUserSettings(await getOrCreateUser())

  const { hasLoggedToday } = deriveDashboardStats(logs)

  // Chosen on the server so the client renders exactly what was sent, matching
  // how the wellness screen picks it — a client-side pick swaps the tip after
  // mount and trips hydration.
  const tipOfTheDay = pickForToday(wellnessTips)

  return (
    <div className="min-h-screen bg-background">
      <AppHeader currentPage="dashboard" />
      <DashboardView
        logs={logs}
        tip={tipOfTheDay}
        settings={settings}
        action={
          <DailyLogDialog
            defaultOpen={logs.length > 0 && !hasLoggedToday}
            trigger={
              <Button className="shrink-0 gap-1.5">
                <PlusCircle className="h-4 w-4" />
                Log today
              </Button>
            }
          />
        }
      />
    </div>
  )
}
