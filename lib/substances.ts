import type { DashboardLog } from "@/lib/dashboard-stats"

/**
 * What someone can be quitting, and how a check-in is read for each.
 *
 * Cigarettes and cannabis are tracked separately: each has its own count in a
 * check-in, its own streak and its own savings, so a slip with one does not
 * reset the other. Pure, so client components can import it.
 */

export const SUBSTANCES = ["cigarettes", "cannabis"] as const
export type Substance = (typeof SUBSTANCES)[number]

export const QUITTING = ["cigarettes", "cannabis", "both"] as const
export type Quitting = (typeof QUITTING)[number]

/** The substances a choice covers, cigarettes first. */
export function tracked(quitting: Quitting): Substance[] {
  if (quitting === "both") return ["cigarettes", "cannabis"]
  return [quitting]
}

/**
 * A check-in as stored: a count per substance, each null when that day says
 * nothing about it. Someone who started on cigarettes and later added
 * cannabis has older days with no session count, and those days are simply
 * not part of the cannabis history.
 */
export type CheckIn = {
  id: string
  ts: Date | string
  cigarettes: number | null
  sessions: number | null
  note?: string | null
}

/** Which column of a check-in holds each substance's count. */
export const COUNT_FIELD = {
  cigarettes: "cigarettes",
  cannabis: "sessions",
} as const satisfies Record<Substance, keyof CheckIn>

export function countFor(checkIn: CheckIn, substance: Substance): number | null {
  return checkIn[COUNT_FIELD[substance]]
}

/** One substance's history, from the check-ins that recorded it. */
export function seriesFor(checkIns: CheckIn[], substance: Substance): DashboardLog[] {
  return checkIns.flatMap((checkIn) => {
    const count = countFor(checkIn, substance)
    return count === null ? [] : [{ id: checkIn.id, ts: checkIn.ts, count, note: checkIn.note }]
  })
}

/**
 * Every check-in as one count, for what a buddy or sponsor sees.
 *
 * A supporter is shown one streak and never told which substance it is about:
 * cannabis is illegal in a lot of places, and who someone shares a streak with
 * is not necessarily who they would tell that to. So a day counts as clean
 * only if nothing was used.
 */
export function combinedSeries(checkIns: CheckIn[]): DashboardLog[] {
  return checkIns.map((checkIn) => ({
    id: checkIn.id,
    ts: checkIn.ts,
    count: (checkIn.cigarettes ?? 0) + (checkIn.sessions ?? 0),
    note: checkIn.note,
  }))
}

/** The words each substance is counted and described in. */
export const SUBSTANCE_COPY = {
  cigarettes: {
    name: "Cigarettes",
    /** "12 days smoke-free" */
    free: "smoke-free",
    /** The count field in a check-in. */
    countLabel: "Cigarettes smoked",
    unit: (n: number) => (n === 1 ? "cigarette" : "cigarettes"),
    notUsed: "Cigarettes not smoked",
    /** The outcome button for a craving that won. */
    gaveIn: "I smoked",
  },
  cannabis: {
    name: "Cannabis",
    free: "cannabis-free",
    countLabel: "Times you used cannabis",
    unit: (n: number) => (n === 1 ? "time" : "times"),
    notUsed: "Times not used",
    gaveIn: "I used",
  },
} as const satisfies Record<Substance, Record<string, unknown>>

/** How the journey headline names a streak of everything being tracked. */
export function streakLabel(quitting: Quitting): string {
  if (quitting === "both") return "free of both"
  return SUBSTANCE_COPY[quitting].free
}

/** A check-in's counts in words, for the journey list: "3 cigarettes · 1 time". */
export function describeCheckIn(checkIn: CheckIn, quitting: Quitting): string {
  const wanted = tracked(quitting).filter((s) => countFor(checkIn, s) !== null)
  // A day from before a change of quit still says something; show what it has.
  const shown = wanted.length > 0 ? wanted : SUBSTANCES.filter((s) => countFor(checkIn, s) !== null)
  const parts = shown.flatMap((substance) => {
    const count = countFor(checkIn, substance)
    if (count === null) return []
    if (count === 0) return [SUBSTANCE_COPY[substance].free.replace(/^./, (c) => c.toUpperCase())]
    const copy = SUBSTANCE_COPY[substance]
    // "Used cannabis 2 times" reads better than "2 times" on its own.
    return substance === "cannabis"
      ? [`Cannabis ${count} ${copy.unit(count)}`]
      : [`${count} ${copy.unit(count)}`]
  })
  return parts.join(" · ")
}
