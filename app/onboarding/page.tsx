import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { OnboardingFlow } from "@/components/onboarding-flow"
import { getOrCreateUser } from "@/lib/auth/getOrCreateUser"
import { getUserSettings } from "@/lib/user-settings.server"

export const dynamic = "force-dynamic"

export default async function OnboardingPage() {
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) redirect("/sign-in")

  const userId = await getOrCreateUser()
  const settings = await getUserSettings(userId)

  return (
    <div className="min-h-screen bg-background">
      <OnboardingFlow settings={settings} />
    </div>
  )
}
