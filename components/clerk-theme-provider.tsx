"use client"

import type React from "react"
import { ClerkProvider } from "@clerk/nextjs"
import { dark } from "@clerk/themes"
import { useTheme } from "next-themes"

/**
 * ClerkProvider wired to the app's theme.
 *
 * Clerk's components render their own styles and do not see our `.dark` class,
 * so without this the sign-in card stays light on a dark page. `baseTheme` is
 * the supported hook for that, and it needs the *resolved* theme because the
 * stored preference is usually "system", which is not a palette.
 *
 * This has to be a client component: `useTheme` reads context published by
 * next-themes, which is why ClerkProvider sits inside ThemeProvider in the
 * layout rather than wrapping <html>.
 */
export function ClerkThemeProvider({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      // A new account has no check-ins, so /app was the empty journey — and
      // onboarding, which is where the baseline and pack price get set, was
      // only reachable by noticing a button on that empty screen.
      afterSignUpUrl="/onboarding"
      // Returning visitors want the summary, not the raw log.
      afterSignInUrl="/dashboard"
      // One Clerk application serves every app on nikolayvalev.com, and its
      // default strings name that shared application ("Sign in to …"). These
      // are the ones that interpolate it, so the card names this app instead.
      localization={{
        signIn: { start: { title: "Sign in to SmokeFree", titleCombined: "Continue to SmokeFree" } },
        signUp: { start: { titleCombined: "Continue to SmokeFree" } },
      }}
      appearance={{
        ...(isDark ? { baseTheme: dark } : {}),
        layout: {
          // Overrides the logo uploaded in the Clerk dashboard, which can only
          // be one file and so cannot suit both card colours. The lockup is
          // monochrome, so a recoloured copy serves the dark card.
          logoImageUrl: isDark ? "/logo-lockup-cream.png" : "/logo-lockup-green.png",
        },
      }}
    >
      {children}
    </ClerkProvider>
  )
}
