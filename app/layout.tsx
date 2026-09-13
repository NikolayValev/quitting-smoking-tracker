import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { ClerkProvider } from '@clerk/nextjs'
import { PostHogProvider } from "@/components/posthog-provider"
import "./globals.css"

export const metadata: Metadata = {
  // Social crawlers need absolute image URLs; without this the og:image
  // resolves relative and link previews come back blank.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://smoking.nikolayvalev.com"),
  title: "Quit Smoking Tracker - Your Smoke-Free Journey",
  description:
    "Track your progress, celebrate milestones, and reclaim your health on your smoke-free journey. Featuring breathing exercises, wellness tips, and personalized support.",
  keywords: ["quit smoking", "smoking cessation", "health tracker", "wellness app", "stop smoking"],
  authors: [{ name: "Quit Smoking App" }],
  openGraph: {
    title: "Quit Smoking Tracker - Your Smoke-Free Journey",
    description: "Track your progress, celebrate milestones, and reclaim your health on your smoke-free journey",
    type: "website",
    locale: "en_US",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "SmokeFree" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Quit Smoking Tracker - Your Smoke-Free Journey",
    description: "Track your progress, celebrate milestones, and reclaim your health on your smoke-free journey",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  generator: "v0.app",
  // The browser-tab icon is app/favicon.ico, picked up by Next's file
  // convention; only the touch icon needs declaring.
  icons: {
    apple: "/apple-icon.png",
  },
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignInUrl="/app"
      afterSignUpUrl="/app"
    >
      <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
        <body className={`font-sans antialiased`}>
          <PostHogProvider>
            {children}
            <Analytics />
          </PostHogProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
