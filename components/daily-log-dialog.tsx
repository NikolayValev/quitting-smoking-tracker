"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { ReactNode } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createLog } from "@/app/app/actions"
import { captureDailyLog } from "@/lib/analytics/posthog"
import { CountFields, parseCounts, type CountDraft } from "@/components/count-fields"
import { tracked, type Quitting } from "@/lib/substances"

/**
 * Today in the browser's own time zone.
 *
 * `toISOString()` alone would give the UTC day, which is the wrong day for
 * anyone far enough east or west — someone in Auckland logging on Tuesday
 * morning would file it under Monday.
 */
function localToday(): string {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 10)
}

/**
 * Logging a check-in.
 *
 * Takes a trigger, because until it had one the only way to reach it was the
 * automatic prompt on page load — and every "Log today" button linked to
 * /onboarding instead, walking people through the pricing questions every time
 * they wanted to record a day.
 */
export function DailyLogDialog({
  defaultOpen = false,
  trigger,
  quitting = "cigarettes",
}: {
  defaultOpen?: boolean
  trigger?: ReactNode
  /** Which counts to ask for: one field per substance being quit. */
  quitting?: Quitting
}) {
  const router = useRouter()
  const [open, setOpen] = useState(defaultOpen)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [draft, setDraft] = useState<CountDraft>({})
  const [note, setNote] = useState("")
  const [date, setDate] = useState(localToday())

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const parsed = parseCounts(tracked(quitting), draft)
    if (!parsed.ok) {
      setError(parsed.error)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await createLog({ ...parsed.counts, note: note || undefined, date })
      if (!result.success) throw new Error(result.error || "Failed to save log")
      // Bucketed total and whether a note was written -- never the note
      // itself, and never which substance.
      captureDailyLog(parsed.total, note.trim().length > 0)
      setOpen(false)
      setDraft({})
      setNote("")
      setDate(localToday())
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log a check-in</DialogTitle>
          <DialogDescription>
            Today by default. Change the date to fill in a day you missed.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm" role="alert">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="dlg-date">Day</Label>
            <Input
              id="dlg-date"
              type="date"
              value={date}
              max={localToday()}
              onChange={(e) => { setDate(e.target.value); setError(null) }}
              required
            />
            <p className="text-xs text-muted-foreground">
              Logging a day again replaces what was there.
            </p>
          </div>

          <CountFields
            substances={tracked(quitting)}
            draft={draft}
            onChange={(next) => { setDraft(next); setError(null) }}
            idPrefix="dlg"
            autoFocus
          />

          <div className="space-y-1.5">
            <Label htmlFor="dlg-note">
              Note <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Textarea
              id="dlg-note"
              placeholder="What set it off, or what helped?"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              {/* "Log later" answers the prompt that opened itself. Somebody who
                  pressed "Log today" is not putting it off, they are backing
                  out. */}
              {defaultOpen ? "Log later" : "Cancel"}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving…" : "Save check-in"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
