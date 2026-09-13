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

  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignInUrl="/app"
      afterSignUpUrl="/app"
      appearance={resolvedTheme === "dark" ? { baseTheme: dark } : undefined}
    >
      {children}
    </ClerkProvider>
  )
}
