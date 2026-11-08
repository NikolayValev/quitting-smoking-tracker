import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy — SmokeFree",
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
        <p className="text-muted-foreground mb-8">Last updated: November 2026</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">What we collect</h2>
            <p className="text-muted-foreground">
              When you sign in with Google, we receive your name and email address from Google. We also store
              what you enter in the app: whether you are quitting cigarettes, cannabis or both; how much you
              smoked or used a day before quitting and what it cost; your daily check-ins, with how many
              cigarettes you smoked and how many times you used cannabis, and any note on them; and the
              cravings you record (which substance, the moment it hit, how strong it was, whether it passed,
              and the hour on your clock).
            </p>
            <p className="text-muted-foreground mt-3">
              If you turn on notifications, we store the address your browser gives us for delivering them. If
              you turn on the daily reminder, we store your time zone, so that it arrives in your day rather
              than ours.
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
              Your data is stored securely in Neon (PostgreSQL), accessed through Drizzle ORM. Every database query
              is scoped to your account at the application level, so only your own records are ever read or written.
              Authentication is handled by Clerk.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Your data: access and deletion</h2>
            <p className="text-muted-foreground">
              You can download a copy of everything we hold about you at any time from your{" "}
              <Link href="/account" className="underline underline-offset-4">
                Account Settings
              </Link>
              . The export is a JSON file containing your profile and every log you have recorded.
            </p>
            <p className="text-muted-foreground mt-3">
              You can also delete your account from the same page. Deleting your account permanently removes all your
              data from our systems, including your profile, quit attempts, and milestones. We show you a deletion
              receipt when it completes, noting how many logs were erased; the receipt is yours alone and is not
              stored by us, so save it if you want a record.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Sharing with a buddy</h2>
            <p className="text-muted-foreground">
              You can invite one or more people to follow your progress. A buddy sees two
              things: how many days you have gone without, and how many health milestones
              you have reached. A sponsor also sees the last day you slipped and how many days
              you slipped in the past month. Neither can see what you are quitting, your
              individual check-ins, how much you smoked or used on any day, or any note you
              have written — those never leave your account. If you are quitting both, the
              streak they see counts only days with neither.
            </p>
            <p className="text-muted-foreground mt-3">
              Sharing is off unless you create an invite. Invite links expire after seven
              days if unused, work once, and either of you can end the share at any time from
              the Buddies page. Ending it takes effect immediately. Deleting your account
              removes every share on both sides.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Analytics</h2>
            <p className="text-muted-foreground">
              We use Vercel Analytics to understand aggregate usage patterns (page views, performance); it does not
              use cookies or collect personally identifiable information. We also use PostHog to understand product
              usage — sign-ins, daily logs, craving strategies, and milestones reached. PostHog events are tied to
              your Clerk user ID, never your name or email, and never include your notes, what you are quitting, or exact counts
              (only coarse ranges). Session recording and click-content capture are disabled.
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
