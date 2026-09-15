import { redirect } from "next/navigation"
import { auth, clerkClient } from "@clerk/nextjs/server"
import { AppHeader } from "@/components/app-header"
import { BuddiesView, type BuddyPerson } from "@/components/buddies-view"
import { getOrCreateUser } from "@/lib/auth/getOrCreateUser"
import { getSharedSummary, listBuddies, listSupporting } from "@/lib/buddies"
import { logError } from "@/lib/observability/logger"
import type { Metadata } from "next"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Buddies - Quit Smoking Tracker",
}

/**
 * Turns Clerk ids into names.
 *
 * Done here rather than in lib/buddies so that module stays free of Clerk, the
 * same way exportUserData takes a profile rather than fetching one. Names are
 * looked up rather than stored: copying another person's name into this
 * database would be keeping a record about someone who only ever agreed to
 * follow a streak.
 *
 * A failed lookup degrades to unnamed rows rather than an error page — not
 * knowing what to call someone is no reason to withhold the list.
 */
async function resolveNames(clerkUserIds: string[]): Promise<Map<string, string>> {
  const ids = clerkUserIds.filter(Boolean)
  if (ids.length === 0) return new Map()

  try {
    const client = await clerkClient()
    const { data } = await client.users.getUserList({ userId: ids, limit: ids.length })
    return new Map(
      data.map((user) => [
        user.id,
        [user.firstName, user.lastName].filter(Boolean).join(" ") ||
          user.emailAddresses[0]?.emailAddress ||
          "Someone",
      ]),
    )
  } catch (error) {
    logError("buddy_name_lookup_failed", error)
    return new Map()
  }
}

export default async function BuddiesPage() {
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) redirect("/sign-in")

  const userId = await getOrCreateUser()
  const [mine, theirs] = await Promise.all([listBuddies(userId), listSupporting(userId)])

  const names = await resolveNames([
    ...mine.map((row) => row.clerkUserId),
    ...theirs.map((row) => row.clerkUserId),
  ].filter((id): id is string => Boolean(id)))

  const buddies: BuddyPerson[] = mine.map((row) => ({
    linkId: row.linkId,
    name: row.clerkUserId ? names.get(row.clerkUserId) ?? null : null,
    state: row.state,
  }))

  // One summary per person followed. Each goes through getSharedSummary, which
  // re-checks the link rather than trusting that listSupporting returned it.
  const supporting: BuddyPerson[] = await Promise.all(
    theirs.map(async (row) => ({
      linkId: row.linkId,
      name: row.clerkUserId ? names.get(row.clerkUserId) ?? null : null,
      state: row.state,
      summary: await getSharedSummary(row.ownerUserId, userId),
    })),
  )

  return (
    <div className="min-h-screen bg-background">
      <AppHeader currentPage="buddies" />
      <BuddiesView buddies={buddies} supporting={supporting} />
    </div>
  )
}
