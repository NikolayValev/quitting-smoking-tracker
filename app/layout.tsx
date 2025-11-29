import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
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
  },
  twitter: {
    card: "summary_large_image",
    title: "Quit Smoking Tracker - Your Smoke-Free Journey",
    description: "Track your progress, celebrate milestones, and reclaim your health on your smoke-free journey",
  },
  robots: {
    index: true,
    follow: true,
  },
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
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
    <html lang="en">
      <body className={`font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
