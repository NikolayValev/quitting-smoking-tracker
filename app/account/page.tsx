import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { DeleteAccountButton } from "./delete-account-button"
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Account Settings - Quit Smoking Tracker",
}

export default async function AccountPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
  const { data: quitAttempt } = await supabase
    .from("quit_attempts")
    .select("quit_date, reason")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single()

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Account Settings</h1>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard">← Dashboard</Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Your account</CardTitle>
            <CardDescription>Your profile information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name</span>
              <span>{profile?.full_name ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span>{user.email}</span>
            </div>
            {quitAttempt && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quit date</span>
                <span>{new Date(quitAttempt.quit_date).toLocaleDateString()}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Danger zone</CardTitle>
            <CardDescription>
              Permanently delete your account and all associated data. This cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Separator className="mb-4" />
            <DeleteAccountButton />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
