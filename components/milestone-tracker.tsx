"use client"

import { useEffect } from "react"
import { captureMilestoneOnce } from "@/lib/analytics/posthog"

/**
 * Reports reached milestones to PostHog.
 *
 * Exists as its own client component because MilestonesDisplay is a Server
 * Component — it derives milestones from the quit date at render time and has
 * no browser APIs. Renders nothing; captureMilestoneOnce dedupes per browser so
 * a milestone is reported once rather than on every page load.
 */
export function MilestoneTracker({ achieved }: { achieved: string[] }) {
  const key = achieved.join(",")

  useEffect(() => {
    achieved.forEach((milestone) => captureMilestoneOnce(milestone))
    // `achieved` is a fresh array each render; key is its stable identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return null
}
