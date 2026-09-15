import { test, expect } from "@playwright/test"
import path from "path"
import { SCREENS } from "./screens"

/** Next's dev overlay floats over the page and is not part of the design. */
const HIDE_DEV_CHROME = `
  nextjs-portal, #__next-build-watcher, [data-nextjs-toast] { display: none !important; }
`

/**
 * Captures every screen at both widths into e2e/screens, so the UI can be
 * looked at rather than guessed about.
 *
 * These are not assertions about pixels — there is no baseline to drift against
 * and no approval step to babysit. They exist to produce artifacts a human (or
 * whoever is working on the design) can open.
 */

const outDir = (project: string, name: string) =>
  path.join("e2e", "screens", `${name}-${project}.png`)

for (const screen of SCREENS) {
  test(`capture ${screen.name}`, async ({ page }, testInfo) => {
    await page.goto(screen.path, { waitUntil: "networkidle" })

    // Wait for real content, not just a quiet network. In dev the first hit on
    // a route compiles it on demand, so networkidle can fire while the document
    // is still empty — which silently produced a blank screenshot that the test
    // still reported as passing.
    await expect(page.locator("main, h1").first()).toBeVisible({ timeout: 30_000 })

    // Fonts settle after first paint; a screenshot taken before they do shows
    // the fallback face and misreports the type.
    await page.evaluate(() => document.fonts.ready)
    await page.addStyleTag({ content: HIDE_DEV_CHROME })

    await page.screenshot({
      path: outDir(testInfo.project.name, screen.name),
      fullPage: true,
      // Freeze transitions: a frame caught mid-slide says nothing about design.
      animations: "disabled",
    })
  })
}

test("mobile nav opens and lists every destination", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "small-screen behaviour only")

  await page.goto("/dev/dashboard", { waitUntil: "networkidle" })

  // The bar is hidden below `sm`; the drawer is the only way through.
  await expect(page.getByRole("navigation")).toBeHidden()

  await page.getByRole("button", { name: /open menu/i }).click()
  const drawer = page.getByRole("dialog")
  await expect(drawer).toBeVisible()

  for (const label of ["Dashboard", "Journey", "Wellness", "Account"]) {
    await expect(drawer.getByRole("link", { name: label })).toBeVisible()
  }

  await page.addStyleTag({ content: HIDE_DEV_CHROME })
  await page.screenshot({
    path: outDir(testInfo.project.name, "nav-open"),
    fullPage: false,
    animations: "disabled",
  })
})
