"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { NAV_ITEMS, type NavKey } from "@/lib/nav"
import { cn } from "@/lib/utils"

/**
 * The small-screen half of the primary nav.
 *
 * Below `sm` the desktop bar is hidden, so without this the app's sections are
 * unreachable on a phone. Both halves read NAV_ITEMS so they cannot drift.
 *
 * Closing on navigation is explicit: the drawer is not unmounted by the route
 * change, so it would otherwise stay open over the new page.
 */
export function MobileNav({ currentPage }: { currentPage?: NavKey }) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="sm:hidden" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-72">
        <SheetHeader className="text-left">
          <SheetTitle>Menu</SheetTitle>
          {/* Radix announces this with the dialog. Hidden visually because the
              links below say the same thing to anyone who can see them. */}
          <SheetDescription className="sr-only">
            Links to the main sections of SmokeFree.
          </SheetDescription>
        </SheetHeader>
        <nav className="mt-6 flex flex-col gap-1">
          {NAV_ITEMS.map(({ key, href, label, icon: Icon }) => {
            const active = currentPage === key
            return (
              <Link
                key={key}
                href={href}
                onClick={() => setOpen(false)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                  active
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            )
          })}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
