"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { relaxationTechniques } from "@/lib/data/wellness-tips"
import { Play, Square } from "lucide-react"
import { cn } from "@/lib/utils"

const mmss = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`

/**
 * Longer relaxation sessions, each one an actual timer.
 *
 * "Start session" previously toggled a dot and nothing else — the screen
 * offered a ten-minute guided session and delivered a change of button label.
 * It now counts the stated time down and says when it is done, which is the
 * smallest version of this that is not a promise the app fails to keep.
 *
 * The four stock photographs are gone. They were fetched from Unsplash at
 * render time, which made a screen someone opens mid-craving depend on a third
 * party being reachable, and they had no visual relationship to each other — a
 * pair of lungs, a neon sign, a seascape and some Scrabble tiles. The cards
 * carry their own quiet weighting instead.
 */
export function RelaxationPreview() {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [remaining, setRemaining] = useState(0)

  useEffect(() => {
    if (!activeId || remaining <= 0) return
    const timer = setTimeout(() => setRemaining(remaining - 1), 1000)
    return () => clearTimeout(timer)
  }, [activeId, remaining])

  const finished = activeId !== null && remaining === 0

  const start = (id: string, minutes: number) => {
    setActiveId(id)
    setRemaining(minutes * 60)
  }

  const stop = () => {
    setActiveId(null)
    setRemaining(0)
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {relaxationTechniques.map((technique) => {
        const isActive = activeId === technique.id
        const total = technique.minutes * 60
        const progress = isActive && total > 0 ? ((total - remaining) / total) * 100 : 0

        return (
          <li
            key={technique.id}
            className={cn(
              "relative overflow-hidden rounded-xl border p-5 transition-colors",
              isActive ? "border-primary/40 bg-primary/5" : "border-border/60 bg-card",
            )}
          >
            {/* The session's progress, drawn as the card filling up rather than
                as another bar competing with the breathing exercise above. */}
            {isActive && (
              <div
                aria-hidden
                className="absolute inset-y-0 left-0 bg-primary/10 transition-[width] duration-1000 ease-linear motion-reduce:transition-none"
                style={{ width: `${progress}%` }}
              />
            )}

            <div className="relative">
              <p className="text-xs text-muted-foreground">{technique.duration}</p>
              <h3 className="mt-1 text-base font-medium tracking-tight">{technique.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{technique.description}</p>

              <div className="mt-4 flex items-center gap-3">
                {isActive ? (
                  <>
                    <Button variant="outline" size="sm" className="gap-2" onClick={stop}>
                      <Square className="h-3.5 w-3.5" aria-hidden />
                      Stop
                    </Button>
                    <span
                      className="text-sm tabular-nums text-muted-foreground"
                      role="timer"
                      aria-live="off"
                    >
                      {finished ? "Done" : `${mmss(remaining)} left`}
                    </span>
                  </>
                ) : (
                  <Button
                    size="sm"
                    className="gap-2"
                    onClick={() => start(technique.id, technique.minutes)}
                    aria-label={`Start ${technique.title}`}
                  >
                    <Play className="h-3.5 w-3.5" aria-hidden />
                    Start
                  </Button>
                )}
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
