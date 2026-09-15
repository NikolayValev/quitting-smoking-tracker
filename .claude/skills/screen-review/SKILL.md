---
name: screen-review
description: Use when changing anything visual in this app — layout, theme, spacing, typography, navigation, a signed-in screen — or when adding a screen that sits behind Clerk and the database and therefore cannot otherwise be looked at.
---

# Looking At The Screens

## Overview

Every interesting screen in this app is behind **both** Clerk and a database, so
there is no way to open one while working on it. That is how the mobile nav came
to be missing entirely without anyone noticing.

`app/dev/[screen]/page.tsx` renders fixtures through the same presentational
components the real routes use, touching neither Clerk nor the database, and
`pnpm screens` captures every one of them at three viewport/theme combinations.

**Core principle:** make a visual change, then look at it. These captures are
artifacts for a human to open — not pixel assertions. There is no baseline to
drift against and no approval step to babysit.

## Running It

```bash
pnpm screens          # all screens, all three projects
pnpm screens --project=mobile
pnpm screens -g "capture dashboard"
```

Output lands in `e2e/screens/<name>-<project>.png`. Playwright starts
`pnpm dev --port 3210` itself and reuses a server already on that port.

Three projects, because most of what goes wrong here goes wrong at one width and
not the other:

| Project | What it catches |
|---|---|
| `desktop` | 1280×900 |
| `desktop-dark` | emulates the OS preference so `next-themes` sets `.dark` |
| `mobile` | Pixel 7 — real touch, DPR and a 393px viewport, not a narrow window |

## Adding a Screen

Two edits, both required:

1. Add a case to `app/dev/[screen]/page.tsx` rendering the view with fixtures
2. Add `{ name, path }` to `SCREENS` in `e2e/screens.ts`

`SCREENS` is shared by the capture spec and the global setup, so one entry gets
you the captures *and* the warm-up. Cover the empty state as its own entry —
`dashboard-empty`, `buddies-empty` — since empty states are where layout
usually breaks.

Fixtures use a **fixed clock** (`NOW = 2025-03-01`, `QUIT_DAY = 2025-01-14`) so
captures do not change by the day. Keep any new fixture on that clock.

Make fixtures say something. An earlier version generated all zeroes, so every
screen showed a flat chart, a peak of zero and savings computed from the
fallback rate instead of real history — the captures passed and showed nothing.

## Why The Spec Waits The Way It Does

Each guard exists because its absence produced a wrong screenshot that still
passed. Do not simplify them away:

- **`globalSetup` pre-requests every route** — `next dev` compiles on first
  request; with workers racing a cold server one screen failed per run, a
  different one each time
- **`expect(page.locator("main, h1").first()).toBeVisible()`** — `networkidle`
  can fire while the document is still empty, producing a blank capture that
  passes
- **`await document.fonts.ready`** — otherwise the shot shows the fallback face
  and misreports the type
- **`animations: "disabled"`** — a frame caught mid-slide says nothing about design
- **`HIDE_DEV_CHROME`** — Next's dev overlay floats over the page and is not
  part of the design

## Common Mistakes

| Mistake | Correction |
|---|---|
| Adding a `/dev` case but not a `SCREENS` entry | It is never captured and never warmed up |
| Treating a capture as a passing visual test | It asserts nothing about pixels. Open the PNG. |
| Building against a production build | `/dev` returns 404 in production — the config runs `next dev` deliberately |
| A new fixture using `new Date()` | Captures change daily and stop being comparable |
| Checking desktop only | The nav bug this harness was built for was mobile-only |
| Using `/dev` to bypass auth | It renders fixtures through presentational components — no Clerk, no database. It is a preview, not a back door. |
