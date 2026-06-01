import Link from "next/link"
import { UserButton } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, BookOpen, Heart } from "lucide-react"

type AppHeaderProps = {
  currentPage?: "dashboard" | "journey" | "wellness" | "account"
}

export function AppHeader({ currentPage }: AppHeaderProps) {
  return (
    <header className="border-b bg-card sticky top-0 z-10">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-base font-semibold tracking-tight">
            Smoke<span className="text-primary">Free</span>
          </Link>
          <nav className="hidden sm:flex items-center gap-1">
            <Button
              variant={currentPage === "dashboard" ? "secondary" : "ghost"}
              size="sm"
              asChild
            >
              <Link href="/dashboard" className="flex items-center gap-1.5">
                <LayoutDashboard className="h-3.5 w-3.5" />
                Dashboard
              </Link>
            </Button>
            <Button
              variant={currentPage === "journey" ? "secondary" : "ghost"}
              size="sm"
              asChild
            >
              <Link href="/app" className="flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" />
                Journey
              </Link>
            </Button>
            <Button
              variant={currentPage === "wellness" ? "secondary" : "ghost"}
              size="sm"
              asChild
            >
              <Link href="/wellness" className="flex items-center gap-1.5">
                <Heart className="h-3.5 w-3.5" />
                Wellness
              </Link>
            </Button>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/account">Account</Link>
          </Button>
          <UserButton />
        </div>
      </div>
    </header>
  )
}
