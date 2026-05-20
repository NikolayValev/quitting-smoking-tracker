import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms of Service - Quit Smoking Tracker",
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <div className="mb-8">
          <Link href="/" className="text-sm text-muted-foreground hover:text-primary">
            ← Back to home
          </Link>
        </div>

        <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Last updated: May 2026</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">Service description</h2>
            <p className="text-muted-foreground">
              Quit Smoking Tracker is a free web application that helps you track your smoke-free journey. It is
              provided as-is with no uptime guarantees.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Not medical advice</h2>
            <p className="text-muted-foreground">
              This app provides motivational tools and progress tracking. It is not a substitute for medical advice,
              diagnosis, or treatment. If you are experiencing severe withdrawal symptoms or health concerns, please
              consult a healthcare professional.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Your account</h2>
            <p className="text-muted-foreground">
              You are responsible for maintaining the security of your Google account used to sign in. You own your
              data and can delete your account at any time from your{" "}
              <Link href="/account" className="underline underline-offset-4">
                Account Settings
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Acceptable use</h2>
            <p className="text-muted-foreground">
              You agree not to use this service for any unlawful purpose or in a way that could harm others. We
              reserve the right to suspend accounts that abuse the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Limitation of liability</h2>
            <p className="text-muted-foreground">
              This service is provided free of charge. To the maximum extent permitted by law, we are not liable for
              any damages arising from your use of or inability to use this service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Changes</h2>
            <p className="text-muted-foreground">
              We may update these terms occasionally. Continued use of the service after changes constitutes
              acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Contact</h2>
            <p className="text-muted-foreground">
              Questions about these terms? Contact us at{" "}
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
