"use client"

import type React from "react"
import { useEffect, useRef } from "react"
import posthog from "posthog-js"
import { PostHogProvider as PHProvider } from "posthog-js/react"
import { useUser } from "@clerk/nextjs"
import { identifyUser, initPostHog, resetUser } from "@/lib/analytics/posthog"

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initPostHog()
  }, [])

  return (
    <PHProvider client={posthog}>
      <ClerkIdentity />
      {children}
    </PHProvider>
  )
}

/**
 * Ties the PostHog person to the Clerk user id.
 *
 * Tracks the last identified id so identify/reset fire only on an actual auth
 * transition. Calling reset() on every render while signed out would churn the
 * anonymous distinct id and break returning-visitor analysis.
 */
function ClerkIdentity() {
  const { isLoaded, isSignedIn, user } = useUser()
  const identifiedRef = useRef<string | null>(null)

  useEffect(() => {
    if (!isLoaded) return

    if (isSignedIn && user && identifiedRef.current !== user.id) {
      identifyUser(user.id)
      identifiedRef.current = user.id
    } else if (!isSignedIn && identifiedRef.current) {
      resetUser()
      identifiedRef.current = null
    }
  }, [isLoaded, isSignedIn, user])

  return null
}
