import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { AppHeader } from "@/components/app-header"
import { WellnessView } from "@/components/wellness-view"
import { pickForToday } from "@/lib/daily"
import { quotesFor, tipsFor } from "@/lib/substance-content"
import { getOrCreateUser } from "@/lib/auth/getOrCreateUser"
import { getUserSettings } from "@/lib/user-settings.server"

export const dynamic = 'force-dynamic';

export default async function WellnessPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect("/sign-in")
  }

  // Chosen here rather than inside the components: the server picks once and
  // the client renders exactly what was sent, so there is no post-mount swap.
  const { quitting } = await getUserSettings(await getOrCreateUser())
  const tipOfTheDay = pickForToday(tipsFor(quitting))
  const quoteOfTheDay = pickForToday(quotesFor(quitting))

  return (
    <div className="min-h-screen bg-background">
      <AppHeader currentPage="wellness" />
      <WellnessView quote={quoteOfTheDay} tip={tipOfTheDay} quitting={quitting} />
    </div>
  )
}
