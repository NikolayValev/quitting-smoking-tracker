import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { BreathingExercise } from "@/components/breathing-exercise"
import { UrgeResistance } from "@/components/urge-resistance"
import { TipLibrary } from "@/components/tip-library"
import { RelaxationPreview } from "@/components/relaxation-preview"
import { DailyTip } from "@/components/daily-tip"
import { MotivationalHero } from "@/components/motivational-hero"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default async function WellnessPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
            <h1 className="text-2xl font-bold">Wellness Center</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <MotivationalHero />

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Tabs defaultValue="urge" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="urge">Resist Urges</TabsTrigger>
                <TabsTrigger value="breathe">Breathe</TabsTrigger>
                <TabsTrigger value="relax">Relax</TabsTrigger>
              </TabsList>
              <TabsContent value="urge" className="mt-6">
                <UrgeResistance />
              </TabsContent>
              <TabsContent value="breathe" className="mt-6">
                <BreathingExercise />
              </TabsContent>
              <TabsContent value="relax" className="mt-6">
                <RelaxationPreview />
              </TabsContent>
            </Tabs>
          </div>

          <div>
            <DailyTip />
          </div>
        </div>

        <TipLibrary />
      </main>
    </div>
  )
}
