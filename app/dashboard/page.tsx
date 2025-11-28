import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MilestonesDisplay } from "@/components/milestones-display"
import Link from "next/link"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  const { data: quitAttempt } = await supabase
    .from("quit_attempts")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("quit_date", { ascending: false })
    .limit(1)
    .single()

  if (!quitAttempt) {
    redirect("/onboarding")
  }

  const smokeFreeMinutes = Math.floor((Date.now() - new Date(quitAttempt.quit_date).getTime()) / (1000 * 60))
  const smokeFreeDays = Math.floor(smokeFreeMinutes / (60 * 24))
  const smokeFreeHours = Math.floor((smokeFreeMinutes % (60 * 24)) / 60)

  const moneySaved =
    ((smokeFreeMinutes / (60 * 24)) * quitAttempt.cigarettes_per_day * Number(quitAttempt.cost_per_pack)) /
    (quitAttempt.cigarettes_per_pack || 20)

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Your Smoke-Free Journey</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{profile?.full_name || user.email}</span>
            <form action="/auth/signout" method="post">
              <Button variant="outline" size="sm">
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">
              {smokeFreeDays} {smokeFreeDays === 1 ? "Day" : "Days"} Smoke-Free
            </h2>
            <p className="text-muted-foreground mt-1">
              {smokeFreeHours > 0 && `and ${smokeFreeHours} ${smokeFreeHours === 1 ? "hour" : "hours"}`}
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
              <div className="text-3xl font-bold text-primary">${moneySaved.toFixed(2)}</div>
              <p className="text-sm text-muted-foreground mt-2">Keep going! Every day adds to your savings.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cigarettes Not Smoked</CardTitle>
              <CardDescription>Your health victory</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {Math.floor((smokeFreeMinutes / (60 * 24)) * quitAttempt.cigarettes_per_day)}
              </div>
              <p className="text-sm text-muted-foreground mt-2">That's a lot of clean breaths!</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Motivation</CardTitle>
              <CardDescription>Why you started</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{quitAttempt.reason || "Stay strong and keep going!"}</p>
            </CardContent>
          </Card>
        </div>

        <MilestonesDisplay quitDate={new Date(quitAttempt.quit_date)} />
      </main>
    </div>
  )
}
