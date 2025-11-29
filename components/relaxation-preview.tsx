"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { relaxationTechniques } from "@/lib/data/wellness-tips"
import { Play, Sparkles } from "lucide-react"
import Image from "next/image"
import { useState } from "react"

const techniqueImages: Record<string, string> = {
  "1": "https://images.unsplash.com/photo-1743767587847-08c42b31cdec?q=80&w=1655&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "2": "https://images.unsplash.com/photo-1507120410856-1f35574c3b45?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "3": "https://images.unsplash.com/photo-1669988021819-f4117fafeb29?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "4": "https://images.unsplash.com/photo-1625121035770-d894ff02ca86?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
}

export function RelaxationPreview() {
  const [activeSession, setActiveSession] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-primary/5 to-primary/10 p-8 text-center">
        <div className="absolute inset-0 opacity-20">
          <Image
            src="https://images.unsplash.com/photo-1743767587847-08c42b31cdec?q=80&w=1655&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            alt="Peaceful zen garden"
            fill
            className="object-cover"
          />
        </div>
        <div className="relative z-10">
          <Sparkles className="h-8 w-8 mx-auto mb-4 text-primary" />
          <h2 className="text-2xl font-bold mb-2">Find Your Calm</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Choose a relaxation technique to help manage stress and cravings. Each session is designed to bring peace
            and clarity to your smoke-free journey.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {relaxationTechniques.map((technique) => (
          <Card
            key={technique.id}
            className="overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 border-2 hover:border-primary/50"
          >
            <div className="relative h-48 w-full bg-gradient-to-br from-primary/10 to-muted">
              <Image
                src={techniqueImages[technique.id] || "/placeholder.svg"}
                alt={technique.title}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              <Badge className="absolute top-4 right-4 bg-background/90 text-foreground" variant="secondary">
                {technique.duration}
              </Badge>
            </div>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                {technique.title}
                {activeSession === technique.id && (
                  <span className="flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                )}
              </CardTitle>
              <CardDescription className="leading-relaxed">{technique.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full gap-2"
                variant={activeSession === technique.id ? "secondary" : "default"}
                onClick={() => setActiveSession(activeSession === technique.id ? null : technique.id)}
              >
                <Play className="h-4 w-4" />
                {activeSession === technique.id ? "End Session" : "Start Session"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="relative overflow-hidden border-2">
        <div className="absolute inset-0 opacity-10">
          <Image
            src="https://images.unsplash.com/photo-1625121035770-d894ff02ca86?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            alt="Serene forest"
            fill
            className="object-cover"
          />
        </div>
        <CardContent className="relative z-10 p-8 text-center">
          <blockquote className="text-lg font-medium italic text-muted-foreground">
            "Breath is the bridge which connects life to consciousness, which unites your body to your thoughts."
          </blockquote>
          <p className="mt-2 text-sm text-muted-foreground">— Thích Nhất Hạnh</p>
        </CardContent>
      </Card>
    </div>
  )
}
