import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy - Quit Smoking Tracker",
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <div className="mb-8">
          <Link href="/" className="text-sm text-muted-foreground hover:text-primary">
            ← Back to home
          </Link>
        </div>

        <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: May 2026</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">What we collect</h2>
            <p className="text-muted-foreground">
              When you sign in with Google, we receive your name and email address from Google. We also store
              information you provide during onboarding: your quit date, cigarettes smoked per day, pack cost,
              cigarettes per pack, and your reason for quitting.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">How we use your data</h2>
            <p className="text-muted-foreground">
              Your data is used solely to power your personal smoke-free dashboard — calculating days smoke-free,
              money saved, and milestone achievements. We do not sell, share, or use your data for advertising.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Where your data is stored</h2>
            <p className="text-muted-foreground">
              Your data is stored securely in Supabase (PostgreSQL). Row-level security policies ensure only you can
              access your own data. Authentication is handled by Supabase Auth with Google OAuth.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Data retention and deletion</h2>
            <p className="text-muted-foreground">
              You can delete your account at any time from your{" "}
              <Link href="/account" className="underline underline-offset-4">
                Account Settings
              </Link>
              . Deleting your account permanently removes all your data from our systems, including your profile,
              quit attempts, and milestones.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Analytics</h2>
            <p className="text-muted-foreground">
              We use Vercel Analytics to understand aggregate usage patterns (page views, performance). Vercel
              Analytics does not use cookies or collect personally identifiable information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Contact</h2>
            <p className="text-muted-foreground">
              For privacy-related questions, contact us at{" "}
              <a href="mailto:nikolaivalev@gmail.com" className="underline underline-offset-4">
                nikolaivalev@gmail.com
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
