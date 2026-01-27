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

export default async function DashboardPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect("/sign-in")
  }

  const result = await getLogs()
  const logs = result.success ? result.data : []

  if (logs.length === 0) {
    redirect("/app")
  }

  // Find the first smoke-free day (cigarettes === 0)
  const smokeFreeLog = logs.find((log: any) => log.cigarettes === 0)
  const quitDate = smokeFreeLog ? new Date(smokeFreeLog.ts) : null

  // Calculate smoke-free time
  const smokeFreeMinutes = quitDate 
    ? Math.max(0, Math.floor((Date.now() - quitDate.getTime()) / (1000 * 60)))
    : 0
  const smokeFreeDays = Math.floor(smokeFreeMinutes / (60 * 24))
  const smokeFreeHours = Math.floor((smokeFreeMinutes % (60 * 24)) / 60)

  // Calculate statistics from logs
  const totalLogs = logs.length
  const cigarettesPerDay = logs.length > 1 
    ? Math.round(logs.slice(0, 7).reduce((sum: number, log: any) => sum + log.cigarettes, 0) / Math.min(7, logs.length))
    : 15 // default estimate
  
  // Estimate cost savings (assuming $10 per pack of 20 cigarettes)
  const costPerCigarette = 0.50
  const cigarettesNotSmoked = smokeFreeMinutes > 0 
    ? Math.floor((smokeFreeMinutes / (60 * 24)) * cigarettesPerDay)
    : 0
  const moneySaved = cigarettesNotSmoked * costPerCigarette

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Your Smoke-Free Journey</h1>
          <div className="flex items-center gap-4">
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">
              {smokeFreeDays > 0 ? `${smokeFreeDays} ${smokeFreeDays === 1 ? "Day" : "Days"} Smoke-Free` : "Building Your Journey"}
            </h2>
            <p className="text-muted-foreground mt-1">
              {smokeFreeHours > 0 && smokeFreeDays > 0 && `and ${smokeFreeHours} ${smokeFreeHours === 1 ? "hour" : "hours"}`}
              {smokeFreeDays === 0 && "Keep tracking your progress!"}
            </p>
          </div>
          <Button size="lg" asChild>
            <Link href="/wellness">Wellness Center</Link>
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Money Saved</CardTitle>
              <CardDescription>Your financial progress</CardDescription>
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
              <CardDescription>Your health victory</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className="text-3xl font-bold text-primary"
                aria-label={`Cigarettes not smoked: ${cigarettesNotSmoked}`}
              >
                {cigarettesNotSmoked}
              </div>
              <p className="text-sm text-muted-foreground mt-2">That's a lot of clean breaths!</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Progress</CardTitle>
              <CardDescription>Logs tracked</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {totalLogs}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {smokeFreeLog ? "Congratulations on going smoke-free!" : "Keep tracking your journey!"}
              </p>
            </CardContent>
          </Card>
        </div>

        {quitDate && <MilestonesDisplay quitDate={quitDate} />}
      </main>
    </div>
  )
}
