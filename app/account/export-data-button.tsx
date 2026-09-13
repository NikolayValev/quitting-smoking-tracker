"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

const FALLBACK_FILENAME = "quit-smoking-tracker-export.json"

/** Pulls the server's filename out of Content-Disposition, if it sent one. */
function filenameFrom(header: string | null): string {
  const match = header?.match(/filename="([^"]+)"/)
  return match?.[1] ?? FALLBACK_FILENAME
}

export function ExportDataButton() {
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleExport = async () => {
    setIsExporting(true)
    setError(null)

    try {
      const res = await fetch("/api/account/export")

      if (!res.ok) {
        // The route answers with JSON on every error path, so this is safe.
        const data = await res.json().catch(() => null)
        setError(data?.error ?? "Failed to build your export")
        return
      }

      // Fetched rather than linked so an error renders in the page instead of
      // replacing it with raw JSON. The blob is handed to a synthetic anchor,
      // which is what turns the response into a saved file.
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = filenameFrom(res.headers.get("content-disposition"))
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)
    } catch {
      setError("Failed to build your export")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <div>
        <Button variant="outline" onClick={handleExport} disabled={isExporting}>
          {isExporting ? "Preparing..." : "Download my data"}
        </Button>
      </div>
    </div>
  )
}
