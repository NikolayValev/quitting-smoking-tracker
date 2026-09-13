import type { LucideIcon } from "lucide-react"
import { LayoutDashboard, BookOpen, Heart, UserRound } from "lucide-react"

export type NavKey = "dashboard" | "journey" | "wellness" | "account"

export type NavItem = {
  key: NavKey
  href: string
  label: string
  icon: LucideIcon
}

/**
 * The app's primary destinations, in one place.
 *
 * The desktop bar and the mobile drawer both read from this. They used to be
 * written out separately, which is how the drawer came to be missing three of
 * the four links.
 */
export const NAV_ITEMS: NavItem[] = [
  { key: "dashboard", href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "journey", href: "/app", label: "Journey", icon: BookOpen },
  { key: "wellness", href: "/wellness", label: "Wellness", icon: Heart },
  { key: "account", href: "/account", label: "Account", icon: UserRound },
]
