import { redirect } from "next/navigation"
import { auth, currentUser } from "@clerk/nextjs/server"
import { AppHeader } from "@/components/app-header"
import { AccountView } from "@/components/account-view"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Account Settings - Quit Smoking Tracker",
}

export default async function AccountPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect("/sign-in")
  }

  const user = await currentUser()
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || null

  return (
    <div className="min-h-screen bg-background">
      <AppHeader currentPage="account" />
      <AccountView name={name} email={user?.emailAddresses[0]?.emailAddress ?? null} />
    </div>
  )
}
