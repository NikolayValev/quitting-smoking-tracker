"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

type Receipt = {
  id: string
  deletedAt: string
  smokeLogsErased: number
}

export function DeleteAccountButton() {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [receipt, setReceipt] = useState<Receipt | null>(null)

  const handleDelete = async () => {
    setIsDeleting(true)
    setError(null)

    const res = await fetch("/api/account/delete", { method: "POST" })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? "Failed to delete your data")
      setIsDeleting(false)
      return
    }

    // Deliberately does not redirect: the receipt is the user's only copy —
    // nothing about it is stored — so navigating away immediately would destroy
    // the proof of erasure we just handed them.
    setReceipt(data.receipt)
    setIsDeleting(false)
  }

  if (receipt) {
    return (
      <div className="flex flex-col gap-3" role="status">
        <div>
          <p className="text-sm font-medium">Your SmokeFree data has been deleted.</p>
          <p className="text-sm text-muted-foreground">
            This receipt is not stored anywhere. Save it if you want a record.
          </p>
        </div>

        <dl className="rounded-md border bg-muted/40 p-3 text-sm space-y-1">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Receipt</dt>
            <dd className="font-mono text-xs break-all">{receipt.id}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Deleted at</dt>
            <dd>{new Date(receipt.deletedAt).toLocaleString()}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Logs erased</dt>
            <dd>{receipt.smokeLogsErased}</dd>
          </div>
        </dl>

        <div>
          <Button onClick={() => router.push("/")}>Done</Button>
        </div>
      </div>
    )
  }

  // items-start so the trigger sizes to its label. Stretched by the column it
  // became a full-width scarlet bar — the loudest thing in the app, for a
  // secondary action nobody should be nudged towards.
  return (
    <div className="flex flex-col items-start gap-2">
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" disabled={isDeleting}>
            {isDeleting ? "Deleting..." : "Delete my data"}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone. Every check-in, craving, setting and buddy share SmokeFree holds will be
              permanently deleted. Download your data first if you want to keep a copy.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Yes, delete my data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
