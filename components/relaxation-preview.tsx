import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { relaxationTechniques } from "@/lib/data/wellness-tips"
import { Play } from "lucide-react"
import Image from "next/image"

export function RelaxationPreview() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {relaxationTechniques.map((technique) => (
        <Card key={technique.id} className="overflow-hidden">
          <div className="relative h-48 w-full bg-muted">
            <Image src={technique.image || "/placeholder.svg"} alt={technique.title} fill className="object-cover" />
          </div>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{technique.title}</CardTitle>
              <Badge variant="secondary">{technique.duration}</Badge>
            </div>
            <CardDescription>{technique.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full gap-2">
              <Play className="h-4 w-4" />
              Start Session
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
