"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"

/**
 * The invite link, shown once.
 *
 * Its own component so it can be looked at in isolation — inside BuddiesView it
 * only appears after a server action succeeds, which needs a signed-in user and
 * a database, so it could not otherwise be reviewed while being designed.
 *
 * The disclosure sits next to the link rather than in the privacy policy. This
 * is the moment someone hands another person a window into a health record, and
 * it is the moment it has to be unambiguous.
 */
export function InvitePanel({ code, origin }: { code: string; origin?: string }) {
  const [copied, setCopied] = useState(false)
  const [failed, setFailed] = useState(false)

  const base = origin ?? (typeof window === "undefined" ? "" : window.location.origin)
  const url = `${base}/join/${code}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setFailed(false)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard access can be refused outright; the link is on screen anyway.
      setFailed(true)
    }
  }

  return (
    <div className="mt-4 rounded-xl border border-primary/25 bg-primary/5 p-5">
      <p className="text-sm font-medium">Send this link to your buddy</p>

      <p className="mt-3 break-all rounded-lg bg-background px-3 py-2 font-mono text-sm">
        {url}
      </p>

      <Button size="sm" variant="outline" className="mt-3 gap-2" onClick={handleCopy}>
        {copied ? (
          <Check className="h-3.5 w-3.5" aria-hidden />
        ) : (
          <Copy className="h-3.5 w-3.5" aria-hidden />
        )}
        {copied ? "Copied" : "Copy link"}
      </Button>
      {failed && (
        <p className="mt-2 text-xs text-destructive" role="alert">
          Could not copy. Select the link above and copy it by hand.
        </p>
      )}

      <dl className="mt-5 space-y-2 border-t border-primary/20 pt-4 text-sm">
        <div>
          <dt className="font-medium">They will see</dt>
          <dd className="text-muted-foreground">
            How many days you have been smoke-free, and how many milestones you have
            reached.
          </dd>
        </div>
        <div>
          <dt className="font-medium">They will not see</dt>
          <dd className="text-muted-foreground">
            Your check-ins, your daily counts, or anything you have written.
          </dd>
        </div>
      </dl>

      <p className="mt-4 text-xs text-muted-foreground">
        Shown once, works once, expires in seven days. You can stop the share at any time.
      </p>
    </div>
  )
}
