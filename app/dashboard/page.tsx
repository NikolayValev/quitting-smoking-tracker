import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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

  // Fetch user's profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Fetch active quit attempt
  const { data: quitAttempt } = await supabase
    .from("quit_attempts")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("quit_date", { ascending: false })
    .limit(1)
    .single()

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Quit Smoking Tracker</h1>
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

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Welcome Back!</CardTitle>
              <CardDescription>Track your progress and stay motivated</CardDescription>
            </CardHeader>
            <CardContent>
              {quitAttempt ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Quit Date: {new Date(quitAttempt.quit_date).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Days Smoke-Free:{" "}
                    {Math.floor((Date.now() - new Date(quitAttempt.quit_date).getTime()) / (1000 * 60 * 60 * 24))}
                  </p>
                </div>
              ) : (
                <Button asChild>
                  <Link href="/quit-attempt/new">Start Your Journey</Link>
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Health Benefits</CardTitle>
              <CardDescription>Your body is healing</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Track the amazing health improvements happening in your body
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Money Saved</CardTitle>
              <CardDescription>Financial progress</CardDescription>
            </CardHeader>
            <CardContent>
              {quitAttempt && quitAttempt.cost_per_pack && quitAttempt.cigarettes_per_day ? (
                <div className="text-2xl font-bold">
                  $
                  {(
                    (Math.floor((Date.now() - new Date(quitAttempt.quit_date).getTime()) / (1000 * 60 * 60 * 24)) *
                      quitAttempt.cigarettes_per_day *
                      Number(quitAttempt.cost_per_pack)) /
                    (quitAttempt.cigarettes_per_pack || 20)
                  ).toFixed(2)}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Start tracking to see your savings</p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
