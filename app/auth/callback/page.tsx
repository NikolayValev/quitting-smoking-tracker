"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Spinner } from "@/components/ui/spinner"

export default function CallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code")
      const errorParam = searchParams.get("error")

      console.log("[v0] Callback page - code present:", !!code)
      console.log("[v0] Callback page - error:", errorParam)

      if (errorParam) {
        setError(errorParam)
        setTimeout(() => router.push("/auth/login"), 3000)
        return
      }

      if (!code) {
        setError("No authorization code received")
        setTimeout(() => router.push("/auth/login"), 3000)
        return
      }

      try {
        console.log("[v0] Sending code to exchange endpoint")

        const response = await fetch("/api/auth/exchange-code", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code }),
        })

        const data = await response.json()

        if (!response.ok || data.error) {
          throw new Error(data.error || "Failed to authenticate")
        }

        console.log("[v0] Authentication successful, redirecting to dashboard")
        router.push("/dashboard")
      } catch (err) {
        console.error("[v0] Callback error:", err)
        setError(err instanceof Error ? err.message : "Authentication failed")
        setTimeout(() => router.push("/auth/login"), 3000)
      }
    }

    handleCallback()
  }, [searchParams, router])

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6">
      <div className="text-center space-y-4">
        {error ? (
          <>
            <p className="text-destructive text-lg font-medium">Authentication Error</p>
            <p className="text-muted-foreground">{error}</p>
            <p className="text-sm text-muted-foreground">Redirecting to login...</p>
          </>
        ) : (
          <>
            <Spinner size="lg" />
            <p className="text-lg font-medium">Completing sign in...</p>
            <p className="text-sm text-muted-foreground">Please wait while we authenticate you</p>
          </>
        )}
      </div>
    </div>
  )
}
