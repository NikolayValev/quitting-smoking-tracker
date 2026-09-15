import { DeleteAccountButton } from "@/app/account/delete-account-button"
import { ExportDataButton } from "@/app/account/export-data-button"

/**
 * Account settings.
 *
 * Three bordered cards became three plain sections separated by rules. The
 * frames added nothing: nobody needs a box drawn around their email address,
 * and giving the destructive section the same treatment as the other two was
 * the only thing making it look ordinary.
 */
export function AccountView({
  name,
  email,
}: {
  name: string | null
  email: string | null
}) {
  return (
    <main className="container mx-auto max-w-2xl px-4 py-12 sm:py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Account</h1>

      <section className="mt-10">
        <h2 className="text-sm font-medium text-muted-foreground">Profile</h2>
        <dl className="mt-3 space-y-3 text-sm">
          {name && (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Name</dt>
              <dd>{name}</dd>
            </div>
          )}
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Email</dt>
            <dd>{email ?? "—"}</dd>
          </div>
        </dl>
      </section>

      <section className="mt-10 border-t border-border/60 pt-8">
        <h2 className="text-sm font-medium text-muted-foreground">Your data</h2>
        <p className="mt-2 max-w-[58ch] text-sm text-muted-foreground">
          Download everything we hold about you — your profile and every check-in —
          as a JSON file.
        </p>
        <div className="mt-4">
          <ExportDataButton />
        </div>
      </section>

      {/* The only section that keeps a frame, because it is the only one where a
          mis-click cannot be undone. */}
      <section className="mt-10 rounded-xl border border-destructive/30 p-5">
        <h2 className="text-sm font-medium text-destructive">Delete account</h2>
        <p className="mt-2 max-w-[58ch] text-sm text-muted-foreground">
          Permanently deletes your account and every check-in. This cannot be undone.
          Download your data first if you want to keep a copy.
        </p>
        <div className="mt-4">
          <DeleteAccountButton />
        </div>
      </section>
    </main>
  )
}
