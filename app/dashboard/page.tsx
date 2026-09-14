import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { getLogs } from "@/app/app/actions"
import { AppHeader } from "@/components/app-header"
import { DashboardView } from "@/components/dashboard-view"
import { DailyLogDialog } from "@/components/daily-log-dialog"
import { deriveDashboardStats } from "@/lib/dashboard-stats"
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

  const { hasLoggedToday } = deriveDashboardStats(logs)

  return (
    <div className="min-h-screen bg-background">
      <AppHeader currentPage="dashboard" />
      <DashboardView logs={logs} />
      {logs.length > 0 && <DailyLogDialog defaultOpen={!hasLoggedToday} />}
    </div>
  )
}
