import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-balance">
              Your Journey to a Smoke-Free Life
            </h1>
            <p className="text-xl text-muted-foreground text-pretty max-w-2xl mx-auto">
              Track your progress, celebrate milestones, and reclaim your health one day at a time
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/auth/login">Get Started</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#features">Learn More</Link>
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-3 mt-16" id="features">
            <Card>
              <CardHeader>
                <CardTitle>Track Progress</CardTitle>
                <CardDescription>Monitor your smoke-free days and health improvements</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  See real-time updates on how your body is healing and recovering
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Save Money</CardTitle>
                <CardDescription>Watch your savings grow day by day</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Calculate exactly how much money you're saving by quitting
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Earn Milestones</CardTitle>
                <CardDescription>Celebrate every achievement along the way</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  From your first hour to your first year, track every victory
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
