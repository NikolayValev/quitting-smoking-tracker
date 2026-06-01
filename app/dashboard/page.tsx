import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { getLogs } from "@/app/app/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MilestonesDisplay } from "@/components/milestones-display"
import { AppHeader } from "@/components/app-header"
import { DailyLogDialog } from "@/components/daily-log-dialog"
import Link from "next/link"
import { DollarSign, Wind, CalendarDays, PlusCircle } from "lucide-react"
import type { Metadata } from "next"

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Dashboard - Quit Smoking Tracker",
  description: "Track your smoke-free progress, view milestones, and access wellness tools",
}

const COST_PER_CIGARETTE_USD = 0.50;

export default async function DashboardPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect("/sign-in")
  }

  const result = await getLogs()
  const logs = result.success ? result.data ?? [] : []

  if (logs.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader currentPage="dashboard" />
        <main className="container mx-auto px-4 py-20 text-center max-w-md">
          <h2 className="text-2xl font-bold mb-3">Ready to start?</h2>
          <p className="text-muted-foreground mb-6">
            Log your first day to begin tracking your smoke-free journey.
          </p>
          <Button asChild size="lg">
            <Link href="/onboarding">Create your first log</Link>
          </Button>
        </main>
      </div>
    )
  }

  const today = new Date().toDateString()
  const hasLoggedToday = logs.length > 0 && new Date(logs[0].ts).toDateString() === today

  const smokeFreeEntries = logs.filter((log: { cigarettes: number }) => log.cigarettes === 0)
  const earliestSmokeFreeLog = smokeFreeEntries[smokeFreeEntries.length - 1]
  const quitDate = earliestSmokeFreeLog ? new Date(earliestSmokeFreeLog.ts) : null

  const smokeFreeMinutes = quitDate
    ? Math.max(0, Math.floor((Date.now() - quitDate.getTime()) / (1000 * 60)))
    : 0
  const smokeFreeDays = Math.floor(smokeFreeMinutes / (60 * 24))
  const smokeFreeHours = Math.floor((smokeFreeMinutes % (60 * 24)) / 60)

  const recentLogs = logs.slice(0, 7)
  const avgCigarettesPerDay = recentLogs.length > 0
    ? recentLogs.reduce((sum: number, log: { cigarettes: number }) => sum + log.cigarettes, 0) / recentLogs.length
    : 15

  const cigarettesNotSmoked = smokeFreeMinutes > 0
    ? Math.floor((smokeFreeMinutes / (60 * 24)) * avgCigarettesPerDay)
    : 0
  const moneySaved = cigarettesNotSmoked * COST_PER_CIGARETTE_USD

  return (
    <div className="min-h-screen bg-background">
      <AppHeader currentPage="dashboard" />

      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {smokeFreeDays > 0
                ? `${smokeFreeDays} ${smokeFreeDays === 1 ? "Day" : "Days"} Smoke-Free`
                : quitDate
                  ? "Smoke-Free Today!"
                  : "Your Journey"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {smokeFreeDays > 0 && smokeFreeHours > 0
                ? `and ${smokeFreeHours} ${smokeFreeHours === 1 ? "hour" : "hours"}`
                : !quitDate
                  ? "Log a smoke-free day to start your counter"
                  : null}
            </p>
          </div>
          <Button asChild>
            <Link href="/onboarding" className="flex items-center gap-1.5">
              <PlusCircle className="h-4 w-4" />
              Log today
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Money Saved</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div
                className="text-3xl font-bold"
                aria-label={`Money saved: $${moneySaved.toFixed(2)}`}
              >
                ${moneySaved.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Based on your average daily count</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Cigarettes Not Smoked</CardTitle>
              <Wind className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div
                className="text-3xl font-bold"
                aria-label={`Cigarettes not smoked: ${cigarettesNotSmoked}`}
              >
                {cigarettesNotSmoked}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Since your first smoke-free day</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Days Tracked</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{logs.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {quitDate ? "Keep going — every day counts" : "Keep tracking your journey"}
              </p>
            </CardContent>
          </Card>
        </div>

        {quitDate && <MilestonesDisplay quitDate={quitDate} />}
      </main>

      <DailyLogDialog defaultOpen={!hasLoggedToday} />
    </div>
  )
}
