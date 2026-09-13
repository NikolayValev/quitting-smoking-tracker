import React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { MobileNav } from "@/components/mobile-nav"
import { NAV_ITEMS } from "@/lib/nav"

vi.mock("next/link", () => ({
  // preventDefault stands in for client-side routing: jsdom cannot navigate,
  // and a real anchor click would log an unimplemented-navigation error.
  default: ({ children, href, onClick, ...rest }: React.ComponentProps<"a">) => (
    <a
      href={href}
      onClick={(e) => {
        e.preventDefault()
        onClick?.(e)
      }}
      {...rest}
    >
      {children}
    </a>
  ),
}))

/** Opens the drawer the way a person on a phone does. */
async function openDrawer() {
  fireEvent.click(screen.getByRole("button", { name: /open menu/i }))
  return screen.findByRole("dialog")
}

describe("MobileNav", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("is the only nav on small screens, so it carries every destination", async () => {
    // The regression this guards: the desktop bar is `hidden sm:flex`, so
    // anything missing here is unreachable on a phone.
    render(<MobileNav />)
    await openDrawer()

    for (const item of NAV_ITEMS) {
      const link = screen.getByRole("link", { name: new RegExp(item.label, "i") })
      expect(link).toHaveAttribute("href", item.href)
    }
  })

  it("stays shut until asked", () => {
    render(<MobileNav />)
    expect(screen.queryByRole("dialog")).toBeNull()
  })

  it("marks the current section for assistive tech, not just colour", async () => {
    render(<MobileNav currentPage="wellness" />)
    await openDrawer()

    const current = screen.getByRole("link", { name: /wellness/i })
    expect(current).toHaveAttribute("aria-current", "page")
    expect(screen.getByRole("link", { name: /dashboard/i })).not.toHaveAttribute(
      "aria-current",
    )
  })

  it("closes when a destination is chosen", async () => {
    // The drawer is not unmounted by a client-side route change, so without an
    // explicit close it would sit open on top of the page just navigated to.
    render(<MobileNav />)
    await openDrawer()

    fireEvent.click(screen.getByRole("link", { name: /journey/i }))

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
  })
})
