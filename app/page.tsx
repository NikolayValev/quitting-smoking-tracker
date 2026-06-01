import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Separator } from "@/components/ui/separator"
import { BarChart2, Wind, Lightbulb } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <span className="text-base font-semibold tracking-tight">
            Smoke<span className="text-primary">Free</span>
          </span>
          <Button size="sm" asChild>
            <Link href="/sign-in">Sign in</Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="py-20 text-center space-y-6">
            <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
              Your smoke-free journey starts here
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-balance">
              Every smoke-free day<br className="hidden md:block" /> is a win worth tracking
            </h1>
            <p className="text-lg text-muted-foreground text-pretty max-w-xl mx-auto">
              Log your progress, practice calming techniques, and watch your health milestones add up — one day at a time.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Button size="lg" asChild>
                <Link href="/sign-in">Get Started Free</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/demo">See a Demo</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-3 pb-20">
            <Card>
              <CardHeader>
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center mb-1">
                  <BarChart2 className="h-4.5 w-4.5 text-primary" />
                </div>
                <CardTitle className="text-base">Track Progress</CardTitle>
                <CardDescription>Monitor smoke-free days and health improvements in real time</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Celebrate milestones from 20 minutes to 10 years smoke-free.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center mb-1">
                  <Wind className="h-4.5 w-4.5 text-primary" />
                </div>
                <CardTitle className="text-base">Wellness Tools</CardTitle>
                <CardDescription>Guided breathing and coping strategies for tough moments</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  A 4-4-6-2 breathing exercise and step-by-step urge resistance guides.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center mb-1">
                  <Lightbulb className="h-4.5 w-4.5 text-primary" />
                </div>
                <CardTitle className="text-base">Daily Support</CardTitle>
                <CardDescription>Fresh tips and motivation updated every day</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  A rotating library of wellness advice across health, motivation, and lifestyle.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Separator />
      <footer className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-6 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} SmokeFree</span>
          <span className="hidden sm:inline">·</span>
          <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
          <span className="hidden sm:inline">·</span>
          <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
        </div>
      </footer>
    </div>
  )
}
