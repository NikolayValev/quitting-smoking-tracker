"use client"

import { useEffect, useState, useSyncExternalStore } from "react"
import { Bell, BellOff, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { removePushSubscription } from "@/app/notifications/actions"
import {
  VAPID_PUBLIC_KEY,
  noSubscribe,
  readPushEnvironment as readEnvironment,
  subscribeThisDevice,
} from "@/lib/push-client"

/** The install prompt Chrome and Edge fire. Not in the DOM types yet. */
type InstallPromptEvent = Event & { prompt: () => Promise<void> }

/**
 * Install the app, and get alerts on this device.
 *
 * Lives on the buddies page because that is where the alerts come from: an
 * "I'm struggling" from someone you sponsor, or encouragement from someone in
 * your corner. Notifications never say who or why. The detail stays behind
 * sign-in.
 */
export function NotificationSettings() {
  const environment = useSyncExternalStore(noSubscribe, readEnvironment, () => "ssr")
  const [subscribed, setSubscribed] = useState<boolean | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null)

  const [platform, mode, push, permission] = environment.split("|")
  // Without keys, push is off server-side too. Say nothing about alerts rather
  // than telling a perfectly capable phone that it "cannot show alerts".
  const pushConfigured = Boolean(VAPID_PUBLIC_KEY)
  const canPush = environment !== "ssr" && push === "push" && pushConfigured

  // Whether this device already has alerts on. Answered asynchronously by the
  // browser, so it is set from the promise, not synchronously in the effect.
  useEffect(() => {
    if (!canPush) return
    let cancelled = false
    navigator.serviceWorker
      .getRegistration("/")
      .then((registration) => registration?.pushManager.getSubscription() ?? null)
      .then((subscription) => {
        if (!cancelled) setSubscribed(subscription !== null)
      })
      .catch(() => {
        if (!cancelled) setSubscribed(false)
      })
    return () => {
      cancelled = true
    }
  }, [canPush])

  useEffect(() => {
    const capture = (event: Event) => {
      event.preventDefault()
      setInstallPrompt(event as InstallPromptEvent)
    }
    window.addEventListener("beforeinstallprompt", capture)
    return () => window.removeEventListener("beforeinstallprompt", capture)
  }, [])

  if (environment === "ssr") return null
  if (!pushConfigured && !installPrompt) return null

  const enable = async () => {
    setBusy(true)
    setError(null)
    const result = await subscribeThisDevice()
    if (result.ok) setSubscribed(true)
    else setError(result.error)
    setBusy(false)
  }

  const disable = async () => {
    setBusy(true)
    setError(null)
    try {
      const registration = await navigator.serviceWorker.getRegistration("/")
      const subscription = await registration?.pushManager.getSubscription()
      if (subscription) {
        await removePushSubscription({ endpoint: subscription.endpoint })
        await subscription.unsubscribe()
      }
      setSubscribed(false)
    } catch {
      setError("Could not turn off alerts.")
    } finally {
      setBusy(false)
    }
  }

  const install = async () => {
    if (!installPrompt) return
    await installPrompt.prompt()
    setInstallPrompt(null)
  }

  // iPhone Safari only gets push for an app added to the Home Screen, and it
  // has no install prompt to fire, so it gets instructions instead.
  const iosNeedsInstall = platform === "ios" && mode === "browser"

  return (
    <section className="mt-8 rounded-xl border border-border/60 p-5">
      <h2 className="text-base font-medium">
        {pushConfigured ? "Alerts on this device" : "Install the app"}
      </h2>

      {!pushConfigured ? null : iosNeedsInstall ? (
        <p className="mt-1 max-w-[58ch] text-sm text-muted-foreground">
          To get alerts on iPhone, add SmokeFree to your Home Screen first: tap{" "}
          <span className="font-medium text-foreground">Share</span>, then{" "}
          <span className="font-medium text-foreground">Add to Home Screen</span>, and open it
          from there.
        </p>
      ) : !canPush ? (
        <p className="mt-1 max-w-[58ch] text-sm text-muted-foreground">
          This browser cannot show alerts. You will still see everything here on the buddies
          page.
        </p>
      ) : permission === "denied" ? (
        <p className="mt-1 max-w-[58ch] text-sm text-muted-foreground">
          Notifications are blocked for this site. Allow them in your browser&rsquo;s site
          settings, then come back.
        </p>
      ) : (
        <>
          <p className="mt-1 max-w-[58ch] text-sm text-muted-foreground">
            A notification when someone you sponsor asks for help, or someone sends you
            encouragement. It never says who or why. That stays in the app.
          </p>
          <Button
            className="mt-4 gap-2"
            variant={subscribed ? "outline" : "default"}
            onClick={subscribed ? disable : enable}
            disabled={busy || subscribed === null}
          >
            {subscribed ? (
              <BellOff className="h-4 w-4" aria-hidden />
            ) : (
              <Bell className="h-4 w-4" aria-hidden />
            )}
            {busy ? "Working…" : subscribed ? "Turn off alerts" : "Turn on alerts"}
          </Button>
        </>
      )}

      {installPrompt && (
        <Button variant="ghost" className="mt-4 ml-2 gap-2" onClick={install}>
          <Download className="h-4 w-4" aria-hidden />
          Install SmokeFree
        </Button>
      )}

      {error && (
        <p className="mt-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </section>
  )
}
