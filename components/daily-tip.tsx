"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { wellnessTips } from "@/lib/data/wellness-tips"
import { Sparkles } from "lucide-react"

export function DailyTip() {
  const [tip, setTip] = useState(wellnessTips[0])

  useEffect(() => {
    // Select a tip based on the day of the year to ensure consistency
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24),
    )
    const tipIndex = dayOfYear % wellnessTips.length
    setTip(wellnessTips[tipIndex])
  }, [])

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      health: "bg-primary/10 text-primary",
      motivation: "bg-accent/10 text-accent-foreground",
      coping: "bg-secondary/10 text-secondary-foreground",
      financial: "bg-muted text-muted-foreground",
      lifestyle: "bg-primary/20 text-primary",
    }
    return colors[category] || "bg-muted text-muted-foreground"
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Daily Wellness Tip</CardTitle>
        </div>
        <CardDescription>Your personalized tip for today</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Badge className={getCategoryColor(tip.category)}>
          {tip.category.charAt(0).toUpperCase() + tip.category.slice(1)}
        </Badge>
        <h3 className="font-semibold text-xl text-balance">{tip.title}</h3>
        <p className="text-muted-foreground leading-relaxed">{tip.description}</p>
      </CardContent>
    </Card>
  )
}
