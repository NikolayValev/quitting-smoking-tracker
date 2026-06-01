import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { BreathingExercise } from "@/components/breathing-exercise"
import { UrgeResistance } from "@/components/urge-resistance"
import { TipLibrary } from "@/components/tip-library"
import { RelaxationPreview } from "@/components/relaxation-preview"
import { DailyTip } from "@/components/daily-tip"
import { MotivationalHero } from "@/components/motivational-hero"
import { AppHeader } from "@/components/app-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export const dynamic = 'force-dynamic';

export default async function WellnessPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect("/sign-in")
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader currentPage="wellness" />

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
