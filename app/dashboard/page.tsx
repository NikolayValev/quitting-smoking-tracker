import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { getLogs } from "@/app/app/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MilestonesDisplay } from "@/components/milestones-display"
import { UserButton } from "@clerk/nextjs"
import Link from "next/link"
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
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold">Your Smoke-Free Journey</h1>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/account">Account</Link>
              </Button>
              <UserButton />
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-16 text-center max-w-md">
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

  // Logs are sorted newest-first. Find the EARLIEST smoke-free log to get true quit date.
  const smokeFreeEntries = logs.filter((log: { cigarettes: number }) => log.cigarettes === 0)
  const earliestSmokeFreeLog = smokeFreeEntries[smokeFreeEntries.length - 1]
  const quitDate = earliestSmokeFreeLog ? new Date(earliestSmokeFreeLog.ts) : null

  const smokeFreeMinutes = quitDate
    ? Math.max(0, Math.floor((Date.now() - quitDate.getTime()) / (1000 * 60)))
    : 0
  const smokeFreeDays = Math.floor(smokeFreeMinutes / (60 * 24))
  const smokeFreeHours = Math.floor((smokeFreeMinutes % (60 * 24)) / 60)

  // Use average from the most recent 7 logs to estimate cigarettes/day for savings calc
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
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Your Smoke-Free Journey</h1>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/account">Account</Link>
            </Button>
            <UserButton />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">
              {smokeFreeDays > 0
                ? `${smokeFreeDays} ${smokeFreeDays === 1 ? "Day" : "Days"} Smoke-Free`
                : quitDate
                  ? "Smoke-Free Today!"
                  : "Building Your Journey"}
            </h2>
            <p className="text-muted-foreground mt-1">
              {smokeFreeDays > 0 && smokeFreeHours > 0 && `and ${smokeFreeHours} ${smokeFreeHours === 1 ? "hour" : "hours"}`}
              {!quitDate && "Log a smoke-free day to start your counter"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" asChild>
              <Link href="/app">Log today</Link>
            </Button>
            <Button size="lg" asChild>
              <Link href="/wellness">Wellness Center</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Money Saved</CardTitle>
              <CardDescription>Based on your average daily count</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary" aria-label={`Money saved: $${moneySaved.toFixed(2)}`}>
                ${moneySaved.toFixed(2)}
              </div>
              <p className="text-sm text-muted-foreground mt-2">Keep going! Every day adds to your savings.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cigarettes Not Smoked</CardTitle>
              <CardDescription>Since your first smoke-free day</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className="text-3xl font-bold text-primary"
                aria-label={`Cigarettes not smoked: ${cigarettesNotSmoked}`}
              >
                {cigarettesNotSmoked}
              </div>
              <p className="text-sm text-muted-foreground mt-2">That&apos;s a lot of clean breaths!</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Total Logs</CardTitle>
              <CardDescription>Days you&apos;ve tracked</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {logs.length}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {quitDate ? "Congratulations on going smoke-free!" : "Keep tracking your journey!"}
              </p>
            </CardContent>
          </Card>
        </div>

        {quitDate && <MilestonesDisplay quitDate={quitDate} />}
      </main>
    </div>
  )
}
