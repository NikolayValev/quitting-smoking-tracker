import { savePushSubscription } from "@/app/notifications/actions"

/**
 * Browser-side push plumbing, shared by the buddy alerts on /buddies and the
 * check-in reminder on /account. Both need this device subscribed; they differ
 * only in what the server then sends to it.
 */

export const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

/**
 * What this browser can do, as one string so useSyncExternalStore sees a
 * stable value. Read on the client only. The server snapshot is "ssr", which
 * renders nothing, so there is no hydration mismatch and no set-state-in-effect.
 */
export function readPushEnvironment(): string {
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent)
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window
  const permission = "Notification" in window ? Notification.permission : "unsupported"
  return [ios ? "ios" : "other", standalone ? "app" : "browser", supported ? "push" : "nopush", permission].join("|")
}

export const noSubscribe = () => () => {}

/** VAPID keys are URL-safe base64; pushManager.subscribe wants bytes. */
function keyBytes(base64: string): Uint8Array<ArrayBuffer> {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/")
  const raw = atob(padded)
  const bytes = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i)
  return bytes
}

/**
 * Asks for permission, subscribes this device and stores it. Safe to call on
 * a device that is already subscribed: the browser hands back the existing
 * subscription and the server upserts it.
 */
export async function subscribeThisDevice(): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" })
    const granted = await Notification.requestPermission()
    if (granted !== "granted") {
      return {
        ok: false,
        error: "Notifications were not allowed. You can change that in your browser's site settings.",
      }
    }
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: keyBytes(VAPID_PUBLIC_KEY!),
    })
    const result = await savePushSubscription(subscription.toJSON())
    if (!result.success) {
      await subscription.unsubscribe()
      return { ok: false, error: result.error }
    }
    return { ok: true }
  } catch {
    return { ok: false, error: "Could not turn on notifications in this browser." }
  }
}
