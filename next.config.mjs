// PostHog ingestion host for the proxy below, set as a shared Vercel variable.
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com"
const POSTHOG_ASSETS_HOST = POSTHOG_HOST.replace(".i.posthog.com", "-assets.i.posthog.com")

/** @type {import('next').NextConfig} */
const nextConfig = {
  // PostHog ingestion is sensitive to the trailing-slash redirect Next would
  // otherwise issue, which drops the request body.
  skipTrailingSlashRedirect: true,
  // Same-origin proxy so ad blockers do not drop events.
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: `${POSTHOG_ASSETS_HOST}/static/:path*`,
      },
      {
        source: "/ingest/:path*",
        destination: `${POSTHOG_HOST}/:path*`,
      },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
}

export default nextConfig
