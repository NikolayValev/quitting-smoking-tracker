"use client"

import { useState } from "react"
import { UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { InvitePanel } from "@/components/invite-panel"
import { createBuddyInvite, revokeBuddyLink } from "@/app/buddies/actions"

export type BuddyPerson = {
  linkId: string
  name: string | null
  state: "active" | "pending" | "expired" | "revoked"
  /** Only present for people this user is supporting. */
  summary?: {
    smokeFreeDays: number
    milestonesReached: number
    milestoneCount: number
  } | null
}

/**
 * Buddies: who can see this person's streak, and whose streaks they can see.
 *
 * The invite panel states exactly what a buddy will be able to see, next to the
 * code rather than buried in a policy page. Someone is about to hand another
 * person a window into a health record; the moment they do it is the moment
 * that has to be unambiguous.
 */
export function BuddiesView({
  buddies,
  supporting,
}: {
  buddies: BuddyPerson[]
  supporting: BuddyPerson[]
}) {
  const [invite, setInvite] = useState<{ code: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleInvite = async () => {
    setBusy(true)
    setError(null)
    const result = await createBuddyInvite()
    setBusy(false)
    if (!result.success) {
      setError(result.error)
      return
    }
    setInvite({ code: result.data.code })
  }

  const handleRevoke = async (linkId: string) => {
    setError(null)
    const result = await revokeBuddyLink({ linkId })
    if (!result.success) setError(result.error)
  }

  return (
    <main className="container mx-auto max-w-2xl px-4 py-12 sm:py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Buddies</h1>
      <p className="mt-3 max-w-[58ch] text-muted-foreground">
        Quitting is easier when someone is watching. Invite one person to follow your
        streak.
      </p>

      {error && (
        <p className="mt-6 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <section className="mt-10 border-t border-border/60 pt-8">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-sm font-medium text-muted-foreground">Following you</h2>
          <Button size="sm" onClick={handleInvite} disabled={busy} className="gap-2">
            <UserPlus className="h-3.5 w-3.5" aria-hidden />
            {busy ? "Creating…" : "Invite a buddy"}
          </Button>
        </div>

        {invite && <InvitePanel code={invite.code} />}

        {buddies.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">Nobody is following you yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-border/60 border-t border-border/60">
            {buddies.map((person) => (
              <li key={person.linkId} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {person.name ?? (person.state === "pending" ? "Waiting to be accepted" : "Someone")}
                  </p>
                  {person.state === "pending" && (
                    <p className="text-xs text-muted-foreground">Invite not used yet</p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleRevoke(person.linkId)}
                  aria-label={`Stop sharing with ${person.name ?? "this person"}`}
                >
                  Stop sharing
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10 border-t border-border/60 pt-8">
        <h2 className="text-sm font-medium text-muted-foreground">You are following</h2>

        {supporting.length === 0 ? (
          <p className="mt-4 max-w-[58ch] text-sm text-muted-foreground">
            Nobody yet. If someone sends you an invite link, opening it adds them here.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-border/60 border-t border-border/60">
            {supporting.map((person) => (
              <li key={person.linkId} className="flex items-center justify-between gap-4 py-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{person.name ?? "Someone"}</p>
                  {person.summary && (
                    <>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {person.summary.smokeFreeDays > 0
                          ? `${person.summary.smokeFreeDays.toLocaleString("en-GB")} days smoke-free`
                          : "Not smoke-free right now"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {person.summary.milestonesReached} of {person.summary.milestoneCount} milestones
                        reached
                      </p>
                    </>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleRevoke(person.linkId)}
                  aria-label={`Stop following ${person.name ?? "this person"}`}
                >
                  Stop following
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
