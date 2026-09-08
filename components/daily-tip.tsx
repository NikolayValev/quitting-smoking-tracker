import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { WellnessTip } from "@/lib/data/wellness-tips"
import { Sparkles } from "lucide-react"

const categoryColors: Record<string, string> = {
  health: "bg-primary/10 text-primary",
  motivation: "bg-accent/10 text-accent-foreground",
  coping: "bg-secondary/10 text-secondary-foreground",
  financial: "bg-muted text-muted-foreground",
  lifestyle: "bg-primary/20 text-primary",
}

/**
 * Presentational. The tip is chosen by the server (see app/wellness/page.tsx)
 * rather than in an effect here — picking it on the client meant rendering the
 * first tip, then swapping it in after mount, which is the hydration mismatch
 * the old effect existed to paper over.
 */
export function DailyTip({ tip }: { tip: WellnessTip }) {
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
        <Badge className={categoryColors[tip.category] || "bg-muted text-muted-foreground"}>
          {tip.category.charAt(0).toUpperCase() + tip.category.slice(1)}
        </Badge>
        <h3 className="font-semibold text-xl text-balance">{tip.title}</h3>
        <p className="text-muted-foreground leading-relaxed">{tip.description}</p>
      </CardContent>
    </Card>
  )
}
