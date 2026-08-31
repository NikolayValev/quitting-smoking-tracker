"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createLog } from "@/app/app/actions"
import { captureDailyLog } from "@/lib/analytics/posthog"

export function DailyLogDialog({ defaultOpen }: { defaultOpen: boolean }) {
  const router = useRouter()
  const [open, setOpen] = useState(defaultOpen)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cigarettes, setCigarettes] = useState("")
  const [note, setNote] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const count = parseInt(cigarettes, 10)
    if (isNaN(count) || count < 0) {
      setError("Please enter a valid number (0 or more)")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await createLog({ cigarettes: count, note: note || undefined })
      if (!result.success) throw new Error(result.error || "Failed to save log")
      // Bucketed count and whether a note was written -- never the note itself.
      captureDailyLog(count, note.trim().length > 0)
      setOpen(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>How did today go?</DialogTitle>
          <DialogDescription>
            Log your cigarettes for today to keep your streak accurate.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm" role="alert">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="dlg-cigarettes">Cigarettes smoked today</Label>
            <Input
              id="dlg-cigarettes"
              type="number"
              min="0"
              placeholder="0"
              value={cigarettes}
              onChange={(e) => { setCigarettes(e.target.value); setError(null) }}
              required
              autoFocus
            />
            <p className="text-xs text-muted-foreground">Enter 0 if you stayed smoke-free today.</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dlg-note">
              Note <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Textarea
              id="dlg-note"
              placeholder="How are you feeling?"
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
              Log later
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving…" : "Save log"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
