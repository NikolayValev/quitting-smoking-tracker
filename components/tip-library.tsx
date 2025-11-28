"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { wellnessTips, type WellnessTip } from "@/lib/data/wellness-tips"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function TipLibrary() {
  const [selectedTip, setSelectedTip] = useState<WellnessTip | null>(null)

  const categories = ["all", "health", "motivation", "coping", "financial", "lifestyle"] as const

  const getCategoryLabel = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1)
  }

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

  if (selectedTip) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Badge className={getCategoryColor(selectedTip.category)}>{getCategoryLabel(selectedTip.category)}</Badge>
              <CardTitle className="text-2xl">{selectedTip.title}</CardTitle>
            </div>
            <button onClick={() => setSelectedTip(null)} className="text-sm text-primary hover:underline">
              Back
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-base leading-relaxed">{selectedTip.longDescription || selectedTip.description}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wellness Tip Library</CardTitle>
        <CardDescription>Explore helpful tips to support your smoke-free journey</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
            {categories.map((category) => (
              <TabsTrigger key={category} value={category} className="text-xs">
                {getCategoryLabel(category)}
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map((category) => (
            <TabsContent key={category} value={category} className="mt-4 space-y-3">
              {wellnessTips
                .filter((tip) => category === "all" || tip.category === category)
                .map((tip) => (
                  <button
                    key={tip.id}
                    onClick={() => setSelectedTip(tip)}
                    className="w-full p-4 rounded-lg border hover:bg-muted/50 transition-colors text-left group"
                  >
                    <div className="flex items-start gap-3">
                      <Badge className={getCategoryColor(tip.category)}>{getCategoryLabel(tip.category)}</Badge>
                      <div className="flex-1">
                        <h3 className="font-semibold group-hover:text-primary transition-colors">{tip.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{tip.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}
