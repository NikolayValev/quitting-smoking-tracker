import { defineConfig, devices } from "@playwright/test"

/**
 * Visual review setup.
 *
 * Runs against `next dev` rather than a production build so the dev-only
 * preview screens under /dev are reachable — those are the only way to see the
 * signed-in layouts, which are otherwise behind both Clerk and the database.
 *
 * Two projects, because most of what goes wrong in this app goes wrong at one
 * width and not the other.
 */
export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  outputDir: "./e2e/.artifacts",
  fullyParallel: true,
  reporter: [["list"]],
  timeout: 60_000,

  use: {
    baseURL: "http://127.0.0.1:3210",
    // Animations off: a screenshot taken mid-transition is not a design signal.
    screenshot: "off",
    trace: "off",
  },

  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 } },
    },
    {
      // The app follows the OS preference, so emulating it is enough to get
      // next-themes to put .dark on the document.
      name: "desktop-dark",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 900 },
        colorScheme: "dark",
      },
    },
    {
      name: "mobile",
      // Real device emulation: touch, DPR and a 393px viewport, not just a
      // narrow window.
      use: { ...devices["Pixel 7"] },
    },
  ],

  webServer: {
    command: "pnpm dev --port 3210",
    url: "http://127.0.0.1:3210",
    reuseExistingServer: true,
    timeout: 180_000,
    stdout: "ignore",
    stderr: "pipe",
  },
})
