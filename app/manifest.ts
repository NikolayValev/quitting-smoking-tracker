import type { MetadataRoute } from "next"

/**
 * What makes the app installable: "Add to Home Screen" on iOS, "Install app"
 * on Android and desktop Chrome. Installing matters beyond convenience. On
 * iOS, web push only works for an app added to the home screen, so this is
 * also what lets an "I'm struggling" reach a sponsor's phone.
 *
 * It opens on the dashboard. A signed-out visitor is sent to sign in by the
 * middleware and comes back there.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SmokeFree",
    short_name: "SmokeFree",
    description: "Quit cigarettes, one day at a time.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#f7f6f1",
    theme_color: "#19432c",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  }
}
