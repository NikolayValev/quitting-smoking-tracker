"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { copingStrategies } from "@/lib/data/wellness-tips"
import { ChevronRight, CheckCircle2 } from "lucide-react"

export function UrgeResistance() {
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])

  const selectedStrategyData = copingStrategies.find((s) => s.id === selectedStrategy)

  const toggleStep = (index: number) => {
    if (completedSteps.includes(index)) {
      setCompletedSteps(completedSteps.filter((i) => i !== index))
    } else {
      setCompletedSteps([...completedSteps, index])
    }
  }

  if (selectedStrategy && selectedStrategyData) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{selectedStrategyData.title}</CardTitle>
              <CardDescription>{selectedStrategyData.description}</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSelectedStrategy(null)}>
              Back
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {selectedStrategyData.steps.map((step, index) => (
              <button
                key={index}
                onClick={() => toggleStep(index)}
                className="w-full flex items-start gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors text-left"
              >
                <div
                  className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                    completedSteps.includes(index) ? "bg-primary border-primary" : "border-muted-foreground"
                  }`}
                >
                  {completedSteps.includes(index) && <CheckCircle2 className="h-4 w-4 text-primary-foreground" />}
                </div>
                <div className="flex-1">
                  <p className={completedSteps.includes(index) ? "line-through text-muted-foreground" : ""}>{step}</p>
                </div>
              </button>
            ))}
          </div>

          {completedSteps.length === selectedStrategyData.steps.length && (
            <div className="mt-6 p-4 bg-primary/10 rounded-lg text-center">
              <p className="font-medium text-primary">Great job! You have completed this strategy.</p>
              <p className="text-sm text-muted-foreground mt-1">The craving should be subsiding now.</p>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resist the Urge</CardTitle>
        <CardDescription>Choose a coping strategy to help you through this craving</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {copingStrategies.map((strategy) => (
            <button
              key={strategy.id}
              onClick={() => setSelectedStrategy(strategy.id)}
              className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors text-left group"
            >
              <div className="flex-1">
                <h3 className="font-semibold">{strategy.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{strategy.description}</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
