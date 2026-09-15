import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { AppHeader } from "@/components/app-header"
import { Button } from "@/components/ui/button"
import { getOrCreateUser } from "@/lib/auth/getOrCreateUser"
import { acceptInvite } from "@/lib/buddies"
import { logError } from "@/lib/observability/logger"

export const dynamic = "force-dynamic"

const MESSAGES: Record<string, { title: string; body: string }> = {
  not_found: {
    title: "That link is not valid",
    body: "Check you copied the whole thing, or ask your buddy to send a new one.",
  },
  expired: {
    title: "That invite has expired",
    body: "Invites last seven days. Ask your buddy to send a new one.",
  },
  revoked: {
    title: "That invite was cancelled",
    body: "The person who sent it has since stopped the share.",
  },
  already_accepted: {
    title: "That invite has already been used",
    body: "Each link works once. Ask for a new one if you need it.",
  },
  self: {
    title: "That is your own invite",
    body: "Send the link to the person you want following you.",
  },
}

/**
 * Accepting an invite.
 *
 * Signed-out visitors are sent through the normal sign-in redirect and land
 * back here, because middleware protects /join — the code alone must never be
 * enough to see anything, and requiring an account is what keeps a health
 * record off a URL that could be forwarded.
 *
 * Accepting is a side effect of loading this page, which is a GET performing a
 * write. That is a deliberate trade: the alternative is a confirmation button,
 * and the link has already been sent person to person with intent. The write is
 * idempotent — a second visit reports that it was already used rather than
 * doing anything again.
 */
export default async function JoinPage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) redirect("/sign-in")

  const { code } = await params

  let result: Awaited<ReturnType<typeof acceptInvite>>
  try {
    const userId = await getOrCreateUser()
    result = await acceptInvite(code, userId)
  } catch (error) {
    logError("buddy_join_failed", error, { clerkUserId })
    result = { ok: false, reason: "not_found" }
  }

  const message = result.ok ? null : MESSAGES[result.reason] ?? MESSAGES.not_found

  return (
    <div className="min-h-screen bg-background">
      <AppHeader currentPage="buddies" />
      <main className="container mx-auto max-w-2xl px-4 py-16">
        {result.ok ? (
          <>
            <h1 className="text-3xl font-semibold tracking-tight">You are following them</h1>
            <p className="mt-3 max-w-[58ch] text-muted-foreground">
              You can see how many days they have been smoke-free and how many milestones
              they have reached. You will not see their check-ins or anything they have
              written. Either of you can stop the share at any time.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-semibold tracking-tight">{message!.title}</h1>
            <p className="mt-3 max-w-[58ch] text-muted-foreground">{message!.body}</p>
          </>
        )}

        <Button asChild size="lg" className="mt-8">
          <Link href="/buddies">Go to buddies</Link>
        </Button>
      </main>
    </div>
  )
}
