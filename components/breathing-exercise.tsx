"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Play, Pause, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"

type BreathingPhase = "inhale" | "hold" | "exhale" | "rest"

/**
 * 4-4-6-2. The long exhale is the active ingredient: a breath out longer than
 * the breath in is what shifts the nervous system out of fight-or-flight.
 *
 * `scale` drives the ring, so the visual is the instruction — the circle is
 * wide open while holding a full breath and small at the bottom of an exhale,
 * and someone can follow it without reading a word.
 */
const phaseConfig = {
  inhale: { duration: 4, next: "hold" as const, label: "Breathe In", scale: "scale-100" },
  hold: { duration: 4, next: "exhale" as const, label: "Hold", scale: "scale-100" },
  exhale: { duration: 6, next: "rest" as const, label: "Breathe Out", scale: "scale-[0.72]" },
  rest: { duration: 2, next: "inhale" as const, label: "Rest", scale: "scale-[0.72]" },
}

const TOTAL_CYCLES = 5

const RADIUS = 116
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export function BreathingExercise() {
  const [isActive, setIsActive] = useState(false)
  const [phase, setPhase] = useState<BreathingPhase>("inhale")
  const [countdown, setCountdown] = useState(4)
  const [cycle, setCycle] = useState(0)

  useEffect(() => {
    if (!isActive) return

    // Everything happens inside the timer callback. The previous version let
    // the countdown reach 0 and then advanced the phase in the effect body,
    // which is a setState during render-commit and cost an extra render pass
    // per phase (react-hooks/set-state-in-effect). The 0 was never visible: it
    // was replaced in the immediately-following cascading render.
    const timer = setTimeout(() => {
      if (countdown > 1) {
        setCountdown(countdown - 1)
        return
      }

      const nextPhase = phaseConfig[phase].next
      setPhase(nextPhase)
      setCountdown(phaseConfig[nextPhase].duration)

      if (nextPhase === "inhale") {
        const completedCycles = cycle + 1
        if (completedCycles >= TOTAL_CYCLES) {
          setIsActive(false)
          setCycle(0)
        } else {
          setCycle(completedCycles)
        }
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [countdown, isActive, phase, cycle])

  const handleStart = () => {
    setIsActive(true)
    setPhase("inhale")
    setCountdown(4)
    setCycle(0)
  }

  const handlePause = () => setIsActive(false)

  const handleReset = () => {
    setIsActive(false)
    setPhase("inhale")
    setCountdown(4)
    setCycle(0)
  }

  const current = phaseConfig[phase]
  const progress = ((current.duration - countdown) / current.duration) * 100

  // Expanded while breathing in and holding, contracted on the way out. Only
  // once running: at rest the ring sits open rather than shrunken, so the
  // screen does not look mid-exercise before anyone has started.
  const ringScale = isActive ? current.scale : "scale-100"

  return (
    <section className="rounded-2xl border border-border/60 bg-card px-6 py-10 sm:px-10">
      <div className="flex flex-col items-center">
        <h2 className="text-sm font-medium text-muted-foreground">Breathing Exercise</h2>
        <p className="mt-1 max-w-[42ch] text-center text-sm text-muted-foreground">
          Four in, four held, six out. Five rounds, about ninety seconds.
        </p>

        <div className="relative mt-8 flex h-[280px] w-[280px] items-center justify-center">
          {/* Soft halo. Purely atmospheric, so it is hidden from the reader
              and does not move when motion is reduced. */}
          <div
            aria-hidden
            className={cn(
              "absolute inset-0 rounded-full bg-primary/10 blur-2xl transition-transform duration-[1200ms] ease-in-out motion-reduce:transition-none motion-reduce:scale-100",
              ringScale,
            )}
          />

          <svg
            viewBox="0 0 280 280"
            className="absolute inset-0 h-full w-full -rotate-90"
            aria-hidden
          >
            <circle
              cx="140"
              cy="140"
              r={RADIUS}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-border/70"
            />
            <circle
              cx="140"
              cy="140"
              r={RADIUS}
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE * (1 - progress / 100)}
              className="text-primary transition-[stroke-dashoffset] duration-1000 ease-linear motion-reduce:transition-none"
            />
          </svg>

          {/* The breathing body itself. */}
          <div
            className={cn(
              "flex h-[208px] w-[208px] items-center justify-center rounded-full",
              // Plain tints rather than an arbitrary radial-gradient value:
              // the gradient silently produced no background at all, which is
              // why the circle read as an empty outline.
              "bg-primary/10 ring-1 ring-primary/25",
              "transition-transform duration-[1200ms] ease-in-out motion-reduce:transition-none motion-reduce:scale-100",
              ringScale,
            )}
            role="timer"
            aria-live="polite"
            aria-label={`${current.label}, ${countdown} seconds remaining`}
          >
            <div className="text-center">
              <div className="text-6xl font-light tracking-tight">{countdown}</div>
              <div className="mt-1 text-sm text-muted-foreground">{current.label}</div>
            </div>
          </div>
        </div>

        {/* Rounds as dots: the shape of the progress is readable at a glance,
            which a "Cycle 2 of 5" label is not when you are not reading. */}
        <div
          className="mt-8 flex items-center gap-2"
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Round ${cycle + 1} of ${TOTAL_CYCLES}`}
        >
          {Array.from({ length: TOTAL_CYCLES }, (_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all duration-500 motion-reduce:transition-none",
                i < cycle ? "w-6 bg-primary" : i === cycle && isActive ? "w-6 bg-primary/40" : "w-1.5 bg-border",
              )}
            />
          ))}
        </div>

        <div className="mt-8 flex items-center gap-3">
          {!isActive ? (
            <Button onClick={handleStart} size="lg" className="gap-2" aria-label="Start breathing exercise">
              <Play className="h-4 w-4" aria-hidden="true" />
              Start
            </Button>
          ) : (
            <Button
              onClick={handlePause}
              size="lg"
              variant="outline"
              className="gap-2"
              aria-label="Pause breathing exercise"
            >
              <Pause className="h-4 w-4" aria-hidden="true" />
              Pause
            </Button>
          )}
          <Button
            onClick={handleReset}
            size="lg"
            variant="ghost"
            className="gap-2"
            aria-label="Reset breathing exercise"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Reset
          </Button>
        </div>
      </div>
    </section>
  )
}
