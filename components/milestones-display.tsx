import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Circle } from "lucide-react"
import { milestoneDefinitions } from "@/lib/data/wellness-tips"

type MilestonesDisplayProps = {
  quitDate: Date
  achievedMilestones?: string[]
}

export function MilestonesDisplay({ quitDate, achievedMilestones = [] }: MilestonesDisplayProps) {
  const now = new Date()
  const smokeFreeMinutes = Math.floor((now.getTime() - quitDate.getTime()) / (1000 * 60))
  const smokeFreeDays = Math.floor(smokeFreeMinutes / (60 * 24))

  const isMilestoneAchieved = (type: string) => {
    const milestoneMinutes: Record<string, number> = {
      "20_minutes": 20,
      "12_hours": 12 * 60,
      "24_hours": 24 * 60,
      "48_hours": 48 * 60,
      "72_hours": 72 * 60,
      "1_week": 7 * 24 * 60,
      "2_weeks": 14 * 24 * 60,
      "1_month": 30 * 24 * 60,
      "3_months": 90 * 24 * 60,
      "6_months": 180 * 24 * 60,
      "1_year": 365 * 24 * 60,
      "5_years": 5 * 365 * 24 * 60,
      "10_years": 10 * 365 * 24 * 60,
    }

    return smokeFreeMinutes >= (milestoneMinutes[type] || Number.POSITIVE_INFINITY)
  }

  const getNextMilestone = () => {
    return milestoneDefinitions.find((m) => !isMilestoneAchieved(m.type))
  }

  const nextMilestone = getNextMilestone()

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Your Milestones</CardTitle>
          <CardDescription>
            {smokeFreeDays} {smokeFreeDays === 1 ? "day" : "days"} smoke-free
          </CardDescription>
        </CardHeader>
        <CardContent>
          {nextMilestone && (
            <div className="p-4 bg-accent/10 rounded-lg mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-accent text-accent-foreground">Next Milestone</Badge>
              </div>
              <h3 className="font-semibold text-lg">{nextMilestone.label}</h3>
              <p className="text-sm text-muted-foreground mt-1">{nextMilestone.description}</p>
            </div>
          )}

          <div className="space-y-3">
            {milestoneDefinitions.map((milestone) => {
              const achieved = isMilestoneAchieved(milestone.type)
              return (
                <div
                  key={milestone.type}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${achieved ? "bg-primary/5 border-primary/20" : "opacity-60"}`}
                >
                  {achieved ? (
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className={`font-semibold ${achieved ? "text-primary" : ""}`}>{milestone.label}</h4>
                      {achieved && <Badge variant="secondary">Achieved</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{milestone.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
