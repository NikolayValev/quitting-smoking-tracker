"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ChevronRight } from "lucide-react"
import { createLog } from "@/app/app/actions"

export default function OnboardingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    cigarettes: "",
    note: "",
  })

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value })
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const cigaretteCount = Number.parseInt(formData.cigarettes);
    
    if (isNaN(cigaretteCount) || cigaretteCount < 0) {
      setError("Please enter a valid number of cigarettes (0 or more)")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await createLog({
        cigarettes: cigaretteCount,
        note: formData.note || "First log entry",
      })

      if (!result.success) {
        throw new Error(result.error || "Failed to create log")
      }

      router.push("/dashboard")
    } catch (err) {
      console.error("Onboarding error:", err)
      setError(err instanceof Error ? err.message : "Failed to save your information. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Welcome to Your Smoke-Free Journey</h1>
          <p className="text-muted-foreground">Let's start tracking your progress</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create Your First Log</CardTitle>
            <CardDescription>
              Track how many cigarettes you smoked today to establish a baseline
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm" role="alert">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="cigarettes">Cigarettes smoked today</Label>
                <Input
                  id="cigarettes"
                  type="number"
                  min="0"
                  placeholder="e.g., 10"
                  value={formData.cigarettes}
                  onChange={(e) => handleChange("cigarettes", e.target.value)}
                  required
                  aria-required="true"
                />
                <p className="text-sm text-muted-foreground">
                  Enter 0 if you're already smoke-free! 🎉
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="note">Note (optional)</Label>
                <Textarea
                  id="note"
                  placeholder="e.g., Feeling determined to quit..."
                  rows={4}
                  value={formData.note}
                  onChange={(e) => handleChange("note", e.target.value)}
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full gap-2">
                {loading ? "Creating log..." : "Start Tracking"}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
