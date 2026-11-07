"use client"

import { useId, useState, useSyncExternalStore } from "react"
import { Switch } from "@/components/ui/switch"
import { setCheckinReminder } from "@/app/notifications/actions"
import { VAPID_PUBLIC_KEY, noSubscribe, readPushEnvironment, subscribeThisDevice } from "@/lib/push-client"

/**
 * A daily nudge to check in, as a push notification.
 *
 * The setting is per person and reaches every device they have notifications
 * on. Turning it on also subscribes this device, so it is one tap rather than
 * a trip to /buddies first. Turning it off leaves the device alone: buddy
 * alerts may still want it.
 *
 * The browser's own time zone is sent with it, which is what lets the server
 * judge "today" and "overnight" by the person's clock.
 */
export function CheckinReminder({ enabled }: { enabled: boolean }) {
  const environment = useSyncExternalStore(noSubscribe, readPushEnvironment, () => "ssr")
  const [on, setOn] = useState(enabled)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const labelId = useId()

  // Without keys the server cannot send either, so the section is left out.
  if (environment === "ssr" || !VAPID_PUBLIC_KEY) return null

  const [platform, mode, push, permission] = environment.split("|")

  const toggle = async (next: boolean) => {
    setBusy(true)
    setError(null)
    try {
      if (next) {
        const device = await subscribeThisDevice()
        if (!device.ok) {
          setError(device.error)
          return
        }
      }
      const result = await setCheckinReminder({
        timeZone: next ? Intl.DateTimeFormat().resolvedOptions().timeZone : null,
      })
      if (result.success) setOn(next)
      else setError(result.error)
    } catch {
      setError("Could not change the reminder.")
    } finally {
      setBusy(false)
    }
  }

  // Off is always reachable, even from a browser that cannot receive: the
  // setting may have been turned on from another device.
  const blocked =
    !on &&
    (platform === "ios" && mode === "browser"
      ? "To get reminders on iPhone, add SmokeFree to your Home Screen first: tap Share, then Add to Home Screen, and open it from there."
      : push !== "push"
        ? "This browser cannot show notifications."
        : permission === "denied"
          ? "Notifications are blocked for this site. Allow them in your browser’s site settings, then come back."
          : null)

  return (
    <section className="mt-10 border-t border-border/60 pt-8">
      <h2 className="text-sm font-medium text-muted-foreground">Reminders</h2>

      {blocked ? (
        <p className="mt-2 max-w-[58ch] text-sm text-muted-foreground">{blocked}</p>
      ) : (
        <div className="mt-4 flex items-start justify-between gap-6">
          <div>
            <p id={labelId} className="text-sm font-medium">
              Daily check-in reminder
            </p>
            <p className="mt-1 max-w-[52ch] text-sm text-muted-foreground">
              Once a day, around 7pm UK time, and only if you have not checked in yet. Never
              overnight where you are. The notification says only that it is time to check in.
            </p>
          </div>
          <Switch
            aria-labelledby={labelId}
            checked={on}
            onCheckedChange={toggle}
            disabled={busy}
            className="mt-0.5"
          />
        </div>
      )}

      {error && (
        <p className="mt-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </section>
  )
}
