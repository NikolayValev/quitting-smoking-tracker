"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play, Pause, RotateCcw } from "lucide-react"

type BreathingPhase = "inhale" | "hold" | "exhale" | "rest"

const phaseConfig = {
  inhale: { duration: 4, next: "hold" as const, label: "Breathe In", color: "bg-primary" },
  hold: { duration: 4, next: "exhale" as const, label: "Hold", color: "bg-accent" },
  exhale: { duration: 6, next: "rest" as const, label: "Breathe Out", color: "bg-secondary" },
  rest: { duration: 2, next: "inhale" as const, label: "Rest", color: "bg-muted" },
}

const TOTAL_CYCLES = 5

export function BreathingExercise() {
  const [isActive, setIsActive] = useState(false)
  const [phase, setPhase] = useState<BreathingPhase>("inhale")
  const [countdown, setCountdown] = useState(4)
  const [cycle, setCycle] = useState(0)

  useEffect(() => {
    if (!isActive) return

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }

    // Move to next phase
    const currentPhase = phaseConfig[phase]
    const nextPhase = currentPhase.next
    setPhase(nextPhase)
    setCountdown(phaseConfig[nextPhase].duration)

    if (nextPhase === "inhale") {
      const newCycle = cycle + 1
      setCycle(newCycle)
      if (newCycle >= TOTAL_CYCLES) {
        setIsActive(false)
        setCycle(0)
      }
    }
  }, [countdown, isActive, phase, cycle])

  const handleStart = () => {
    setIsActive(true)
    setPhase("inhale")
    setCountdown(4)
    setCycle(0)
  }

  const handlePause = () => {
    setIsActive(false)
  }

  const handleReset = () => {
    setIsActive(false)
    setPhase("inhale")
    setCountdown(4)
    setCycle(0)
  }

  const currentPhaseConfig = phaseConfig[phase]
  const progress = ((currentPhaseConfig.duration - countdown) / currentPhaseConfig.duration) * 100

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Breathing Exercise</CardTitle>
        <CardDescription>Follow the guided breathing to calm your mind and reduce cravings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center justify-center py-8 space-y-6">
          <div className="relative">
            <div
              className={`w-48 h-48 rounded-full ${currentPhaseConfig.color} transition-all duration-1000 flex items-center justify-center ${
                isActive && phase === "inhale" ? "scale-125" : phase === "exhale" ? "scale-75" : "scale-100"
              }`}
              role="timer"
              aria-live="polite"
              aria-label={`${currentPhaseConfig.label}, ${countdown} seconds remaining`}
            >
              <div className="text-center">
                <div className="text-5xl font-bold text-foreground">{countdown}</div>
                <div className="text-sm font-medium text-muted-foreground mt-2">{currentPhaseConfig.label}</div>
              </div>
            </div>
          </div>

          <div className="w-full max-w-xs space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Cycle {cycle + 1} of {TOTAL_CYCLES}
              </span>
              <span className="text-muted-foreground">{Math.round(progress)}%</span>
            </div>
            <div
              className="w-full bg-muted rounded-full h-2"
              role="progressbar"
              aria-valuenow={Math.round(progress)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3">
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
              className="gap-2 bg-transparent"
              aria-label="Pause breathing exercise"
            >
              <Pause className="h-4 w-4" aria-hidden="true" />
              Pause
            </Button>
          )}
          <Button
            onClick={handleReset}
            size="lg"
            variant="outline"
            className="gap-2 bg-transparent"
            aria-label="Reset breathing exercise"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
