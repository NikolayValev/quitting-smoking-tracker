import Link from "next/link"
import { UserButton } from "@clerk/nextjs"
import { Logo } from "@/components/logo"
import { MobileNav } from "@/components/mobile-nav"
import { NAV_ITEMS, type NavKey } from "@/lib/nav"
import { cn } from "@/lib/utils"

type AppHeaderProps = {
  currentPage?: NavKey
}

export function AppHeader({ currentPage }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="container mx-auto flex h-14 items-center gap-4 px-4">
        <Link href="/dashboard" aria-label="SmokeFree home" className="shrink-0">
          <Logo />
        </Link>

        {/* Below `sm` this is replaced by MobileNav, not dropped. */}
        <nav className="hidden flex-1 items-center gap-1 sm:flex">
          {NAV_ITEMS.filter((item) => item.key !== "account").map(
            ({ key, href, label, icon: Icon }) => {
              const active = currentPage === key
              return (
                <Link
                  key={key}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors",
                    active
                      ? "bg-primary/10 font-medium text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </Link>
              )
            },
          )}
        </nav>

        <div className="ml-auto flex items-center gap-1 sm:ml-0">
          <Link
            href="/account"
            aria-current={currentPage === "account" ? "page" : undefined}
            className={cn(
              "hidden rounded-full px-3 py-1.5 text-sm transition-colors sm:block",
              currentPage === "account"
                ? "bg-primary/10 font-medium text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            Account
          </Link>
          <UserButton />
          <MobileNav currentPage={currentPage} />
        </div>
      </div>
    </header>
  )
}
