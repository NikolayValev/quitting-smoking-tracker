import { test, expect } from "@playwright/test"

/**
 * "Log today" used to be a link to /onboarding, so recording a check-in walked
 * you through the pricing questions every time. This pins that it opens a
 * dialog and stays on the page.
 */
test("logging a check-in opens a dialog rather than navigating", async ({ page }) => {
  await page.goto("/dev/dashboard", { waitUntil: "networkidle" })
  await expect(page.locator("main").first()).toBeVisible()

  const before = page.url()
  await page.getByRole("button", { name: /log today/i }).click()

  const dialog = page.getByRole("dialog")
  await expect(dialog).toBeVisible()
  await expect(dialog.getByLabel("Day")).toBeVisible()
  await expect(dialog.getByLabel(/cigarettes smoked/i)).toBeVisible()
  expect(page.url()).toBe(before)
  await expect(page).not.toHaveURL(/onboarding/)
})
