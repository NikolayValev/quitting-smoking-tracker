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
  accountErased: boolean
  smokeLogsErased: number | null
  complete: boolean
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
      setError(data.error ?? "Failed to delete account")
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
          <p className="text-sm font-medium">Your account has been deleted.</p>
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
          {receipt.smokeLogsErased !== null && (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Logs erased</dt>
              <dd>{receipt.smokeLogsErased}</dd>
            </div>
          )}
        </dl>

        {!receipt.complete && (
          <p className="text-sm text-muted-foreground">
            Your sign-in has been removed. The last of your logs are still being erased and will be
            gone shortly.
          </p>
        )}

        <div>
          <Button onClick={() => router.push("/")}>Done</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" disabled={isDeleting}>
            {isDeleting ? "Deleting..." : "Delete account"}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Your account and all data — including your quit attempts, milestones, and
              progress — will be permanently deleted. Download your data first if you want to keep a copy.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Yes, delete my account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
