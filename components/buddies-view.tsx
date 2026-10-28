"use client"

import { useState } from "react"
import Link from "next/link"
import { HeartHandshake, LifeBuoy, UserPlus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { InvitePanel } from "@/components/invite-panel"
import {
  createBuddyInvite,
  revokeBuddyLink,
  sendCheerSignal,
  sendSosSignal,
} from "@/app/buddies/actions"

type Role = "buddy" | "sponsor"
type CheerKind = "proud" | "keep_going" | "here_for_you"

/**
 * The words behind each preset. Only the key is stored, so sender and receiver
 * both read them from here.
 */
const CHEER_LABELS: Record<CheerKind, string> = {
  proud: "Proud of you",
  keep_going: "Keep going",
  here_for_you: "I'm here if you need me",
}

export type BuddyPerson = {
  linkId: string
  name: string | null
  state: "active" | "pending" | "expired" | "revoked"
  role: Role
  /** Only present for people this user is supporting. Slip fields only for a sponsor. */
  summary?: {
    smokeFreeDays: number
    milestonesReached: number
    milestoneCount: number
    lastSlipOn?: string | null
    slipDaysRecent?: number
  } | null
  /** Supporting only: how long ago they asked for help, if recently. */
  askedForHelp?: string | null
}

export type ReceivedCheer = {
  id: string
  name: string | null
  kind: CheerKind
  /** Already formatted, e.g. "2 hours ago" — computed server side. */
  when: string
}

/** "2025-02-03" → "3 Feb". The date is a calendar day, so it is read as UTC. */
function formatDay(day: string) {
  return new Date(`${day}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  })
}

/**
 * Buddies and sponsors: who can see this person's streak, and whose streaks
 * they can see.
 *
 * The invite panel states exactly what each kind of supporter will be able to
 * see, next to the code rather than buried in a policy page. Someone is about
 * to hand another person a window into a health record; the moment they do it
 * is the moment that has to be unambiguous.
 */
export function BuddiesView({
  buddies,
  supporting,
  cheers = [],
}: {
  buddies: BuddyPerson[]
  supporting: BuddyPerson[]
  cheers?: ReceivedCheer[]
}) {
  const [invite, setInvite] = useState<{ code: string; role: Role } | null>(null)
  const [busy, setBusy] = useState<Role | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sos, setSos] = useState<"idle" | "sending" | "sent">("idle")
  const [cheered, setCheered] = useState<Record<string, CheerKind>>({})

  const hasSponsor = buddies.some((p) => p.role === "sponsor" && p.state === "active")
  const calls = supporting.filter((p) => p.askedForHelp)

  const handleInvite = async (role: Role) => {
    setBusy(role)
    setError(null)
    const result = await createBuddyInvite({ role })
    setBusy(null)
    if (!result.success) {
      setError(result.error)
      return
    }
    setInvite({ code: result.data.code, role })
  }

  const handleRevoke = async (linkId: string) => {
    setError(null)
    const result = await revokeBuddyLink({ linkId })
    if (!result.success) setError(result.error)
  }

  const handleSos = async () => {
    setSos("sending")
    setError(null)
    const result = await sendSosSignal()
    if (!result.success) {
      setSos("idle")
      setError(result.error)
      return
    }
    setSos("sent")
  }

  const handleCheer = async (linkId: string, kind: CheerKind) => {
    setError(null)
    const result = await sendCheerSignal({ linkId, kind })
    if (!result.success) {
      setError(result.error)
      return
    }
    setCheered((prev) => ({ ...prev, [linkId]: kind }))
  }

  return (
    <main className="container mx-auto max-w-2xl px-4 py-12 sm:py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Buddies</h1>
      <p className="mt-3 max-w-[58ch] text-muted-foreground">
        Quitting is easier when someone is in your corner. A buddy follows your streak.
        A sponsor also sees when you slip, and is who you reach for when it gets hard.
      </p>

      {error && (
        <p className="mt-6 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      {calls.map((person) => (
        <div
          key={`call-${person.linkId}`}
          className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4"
          role="status"
        >
          <p className="flex items-center gap-2 text-sm font-medium">
            <LifeBuoy className="h-4 w-4 text-destructive" aria-hidden />
            {person.name ?? "Someone you sponsor"} is having a hard time
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            They asked for help {person.askedForHelp}. A message or a call now matters more
            than the right words.
          </p>
        </div>
      ))}

      {hasSponsor && (
        <section className="mt-8 rounded-xl border border-border/60 p-5">
          <h2 className="text-base font-medium">Having a hard moment?</h2>
          {sos === "sent" ? (
            <p className="mt-2 text-sm text-muted-foreground" role="status">
              Your sponsor has been told. While you wait,{" "}
              <Link href="/wellness" className="font-medium text-primary underline-offset-4 hover:underline">
                try the breathing exercise
              </Link>{" "}
              — most cravings pass within a few minutes.
            </p>
          ) : (
            <>
              <p className="mt-1 text-sm text-muted-foreground">
                One tap lets your sponsor know you are struggling. Nothing else is sent.
              </p>
              <Button
                className="mt-4 gap-2"
                variant="destructive"
                onClick={handleSos}
                disabled={sos === "sending"}
              >
                <LifeBuoy className="h-4 w-4" aria-hidden />
                {sos === "sending" ? "Sending…" : "I'm struggling"}
              </Button>
            </>
          )}
        </section>
      )}

      {cheers.length > 0 && (
        <section className="mt-10 border-t border-border/60 pt-8">
          <h2 className="text-sm font-medium text-muted-foreground">Encouragement</h2>
          <ul className="mt-4 space-y-3">
            {cheers.map((cheer) => (
              <li key={cheer.id} className="flex items-start gap-3">
                <HeartHandshake className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                <p className="text-sm">
                  <span className="font-medium">{cheer.name ?? "Someone"}</span>
                  <span className="text-muted-foreground">: “{CHEER_LABELS[cheer.kind]}” · {cheer.when}</span>
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-10 border-t border-border/60 pt-8">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-sm font-medium text-muted-foreground">Supporting you</h2>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleInvite("buddy")}
              disabled={busy !== null}
              className="gap-2"
            >
              <UserPlus className="h-3.5 w-3.5" aria-hidden />
              {busy === "buddy" ? "Creating…" : "Invite a buddy"}
            </Button>
            <Button
              size="sm"
              onClick={() => handleInvite("sponsor")}
              disabled={busy !== null}
              className="gap-2"
            >
              <HeartHandshake className="h-3.5 w-3.5" aria-hidden />
              {busy === "sponsor" ? "Creating…" : "Invite a sponsor"}
            </Button>
          </div>
        </div>

        {invite && <InvitePanel code={invite.code} role={invite.role} />}

        {buddies.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">Nobody is supporting you yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-border/60 border-t border-border/60">
            {buddies.map((person) => (
              <li key={person.linkId} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                    {person.name ?? (person.state === "pending" ? "Waiting to be accepted" : "Someone")}
                    <Badge variant={person.role === "sponsor" ? "default" : "secondary"}>
                      {person.role === "sponsor" ? "Sponsor" : "Buddy"}
                    </Badge>
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
        <h2 className="text-sm font-medium text-muted-foreground">You are supporting</h2>

        {supporting.length === 0 ? (
          <p className="mt-4 max-w-[58ch] text-sm text-muted-foreground">
            Nobody yet. If someone sends you an invite link, opening it adds them here.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-border/60 border-t border-border/60">
            {supporting.map((person) => (
              <li key={person.linkId} className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                      {person.name ?? "Someone"}
                      {person.role === "sponsor" && <Badge variant="secondary">You sponsor them</Badge>}
                    </p>
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
                        {person.summary.slipDaysRecent !== undefined && (
                          <p className="text-xs text-muted-foreground">
                            {person.summary.lastSlipOn
                              ? `Last slipped ${formatDay(person.summary.lastSlipOn)} · ${person.summary.slipDaysRecent} slip ${person.summary.slipDaysRecent === 1 ? "day" : "days"} in the last 30`
                              : "No slips logged"}
                          </p>
                        )}
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
                </div>

                {person.state === "active" && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {cheered[person.linkId] ? (
                      <p className="text-xs text-muted-foreground" role="status">
                        Sent “{CHEER_LABELS[cheered[person.linkId]]}”
                      </p>
                    ) : (
                      (Object.keys(CHEER_LABELS) as CheerKind[]).map((kind) => (
                        <Button
                          key={kind}
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs"
                          onClick={() => handleCheer(person.linkId, kind)}
                        >
                          {CHEER_LABELS[kind]}
                        </Button>
                      ))
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
