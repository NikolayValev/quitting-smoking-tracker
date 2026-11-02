/**
 * SmokeFree service worker. Push notifications only.
 *
 * There is deliberately no fetch handler and no cache: a stale copy of a
 * health dashboard is worse than a network error, and installability no
 * longer requires one. This file only shows what the server pushes and opens
 * the app when it is tapped.
 */

self.addEventListener("install", () => self.skipWaiting())
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()))

self.addEventListener("push", (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    // A payload we cannot read still deserves a notification rather than
    // silence, since an SOS is the likeliest thing to arrive here.
  }

  event.waitUntil(
    self.registration.showNotification(data.title || "SmokeFree", {
      body: data.body || "",
      icon: "/icon-192.png",
      tag: data.tag,
      renotify: Boolean(data.tag),
      data: { url: data.url || "/dashboard" },
    }),
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  const target = new URL(
    (event.notification.data && event.notification.data.url) || "/dashboard",
    self.location.origin,
  )
  // Only ever open this app's own pages, whatever the payload said.
  if (target.origin !== self.location.origin) return

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      for (const client of windows) {
        if (new URL(client.url).origin === target.origin && "focus" in client) {
          return client.navigate(target.href).then((c) => (c || client).focus())
        }
      }
      return self.clients.openWindow(target.href)
    }),
  )
})
