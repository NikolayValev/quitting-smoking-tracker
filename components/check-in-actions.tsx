"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Pencil } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { deleteLog, updateLog } from "@/app/app/actions"

/**
 * Correcting or removing one check-in.
 *
 * Rendered only where the entries belong to the person looking at them — the
 * demo shows the same list and must stay read-only, so JourneyView takes an
 * `editable` flag rather than this deciding for itself.
 */
export function CheckInActions({
  id,
  date,
  cigarettes,
  note,
}: {
  id: string
  date: string
  cigarettes: number
  note: string | null
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [count, setCount] = useState(String(cigarettes))
  const [text, setText] = useState(note ?? "")

  const save = async () => {
    const parsed = Number.parseInt(count, 10)
    if (Number.isNaN(parsed) || parsed < 0) {
      setError("Enter a number, 0 or more.")
      return
    }

    setBusy(true)
    setError(null)
    const result = await updateLog({ id, cigarettes: parsed, note: text || undefined })
    setBusy(false)

    if (!result.success) {
      setError(result.error ?? "Could not save that change")
      return
    }
    setOpen(false)
    router.refresh()
  }

  const remove = async () => {
    setBusy(true)
    setError(null)
    const result = await deleteLog({ id })
    setBusy(false)

    if (!result.success) {
      setError(result.error ?? "Could not delete that check-in")
      return
    }
    setOpen(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          // Quiet by default rather than hidden until hover: a hover-only
          // control does not exist on a touch screen, which is where most of
          // these check-ins get corrected.
          className="h-7 w-7 shrink-0 text-muted-foreground/50 transition-colors hover:text-foreground"
          aria-label={`Edit check-in for ${date}`}
        >
          <Pencil className="h-3.5 w-3.5" aria-hidden />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit {date}</DialogTitle>
          <DialogDescription>
            Change what you recorded, or remove the day entirely.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor={`edit-count-${id}`}>Cigarettes smoked</Label>
            <Input
              id={`edit-count-${id}`}
              type="number"
              min="0"
              value={count}
              onChange={(e) => { setCount(e.target.value); setError(null) }}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`edit-note-${id}`}>
              Note <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id={`edit-note-${id}`}
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={remove}
            disabled={busy}
          >
            Delete this day
          </Button>
          <Button type="button" onClick={save} disabled={busy}>
            {busy ? "Saving…" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
