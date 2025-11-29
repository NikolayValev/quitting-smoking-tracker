"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { ChevronRight, ChevronLeft } from "lucide-react"

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    fullName: "",
    quitDate: new Date().toISOString().split("T")[0],
    cigarettesPerDay: "",
    costPerPack: "",
    cigarettesPerPack: "20",
    reason: "",
  })

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value })
    setError(null) // Clear error on input change
  }

  const validateStep = () => {
    if (step === 1) {
      if (!formData.fullName.trim()) {
        setError("Please enter your name")
        return false
      }
      if (!formData.quitDate) {
        setError("Please select a quit date")
        return false
      }
    }
    if (step === 2) {
      if (!formData.cigarettesPerDay || Number.parseInt(formData.cigarettesPerDay) <= 0) {
        setError("Please enter a valid number of cigarettes per day")
        return false
      }
      if (!formData.costPerPack || Number.parseFloat(formData.costPerPack) <= 0) {
        setError("Please enter a valid cost per pack")
        return false
      }
      if (!formData.cigarettesPerPack || Number.parseInt(formData.cigarettesPerPack) <= 0) {
        setError("Please enter a valid number of cigarettes per pack")
        return false
      }
    }
    return true
  }

  const handleNext = () => {
    if (validateStep()) {
      setStep(step + 1)
    }
  }

  const handleSubmit = async () => {
    if (!validateStep()) return

    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ full_name: formData.fullName })
        .eq("id", user.id)

      if (profileError) throw profileError

      // Create quit attempt
      const { error: quitError } = await supabase.from("quit_attempts").insert({
        user_id: user.id,
        quit_date: formData.quitDate,
        cigarettes_per_day: Number.parseInt(formData.cigarettesPerDay),
        cost_per_pack: Number.parseFloat(formData.costPerPack),
        cigarettes_per_pack: Number.parseInt(formData.cigarettesPerPack),
        reason: formData.reason,
        is_active: true,
      })

      if (quitError) throw quitError

      router.push("/dashboard")
    } catch (err) {
      console.error("Onboarding error:", err)
      setError("Failed to save your information. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const totalSteps = 3

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Welcome to Your Smoke-Free Journey</h1>
          <p className="text-muted-foreground">Let's personalize your experience</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <CardTitle>
                Step {step} of {totalSteps}
              </CardTitle>
              <div
                className="text-sm text-muted-foreground"
                aria-label={`${Math.round((step / totalSteps) * 100)}% complete`}
              >
                {Math.round((step / totalSteps) * 100)}% Complete
              </div>
            </div>
            <div
              className="w-full bg-muted rounded-full h-2"
              role="progressbar"
              aria-valuenow={Math.round((step / totalSteps) * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${(step / totalSteps) * 100}%` }}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm" role="alert">
                {error}
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <CardTitle className="text-xl mb-2">Tell us about yourself</CardTitle>
                  <CardDescription>This helps us personalize your experience</CardDescription>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    placeholder="Enter your name"
                    value={formData.fullName}
                    onChange={(e) => handleChange("fullName", e.target.value)}
                    required
                    aria-required="true"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quitDate">When did you quit (or when will you quit)?</Label>
                  <Input
                    id="quitDate"
                    type="date"
                    value={formData.quitDate}
                    onChange={(e) => handleChange("quitDate", e.target.value)}
                    required
                    aria-required="true"
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <CardTitle className="text-xl mb-2">Your smoking habits</CardTitle>
                  <CardDescription>Help us calculate your progress and savings</CardDescription>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cigarettesPerDay">How many cigarettes did you smoke per day?</Label>
                  <Input
                    id="cigarettesPerDay"
                    type="number"
                    min="1"
                    placeholder="e.g., 10"
                    value={formData.cigarettesPerDay}
                    onChange={(e) => handleChange("cigarettesPerDay", e.target.value)}
                    required
                    aria-required="true"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="costPerPack">Cost per pack (in your currency)</Label>
                  <Input
                    id="costPerPack"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="e.g., 10.00"
                    value={formData.costPerPack}
                    onChange={(e) => handleChange("costPerPack", e.target.value)}
                    required
                    aria-required="true"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cigarettesPerPack">Cigarettes per pack</Label>
                  <Input
                    id="cigarettesPerPack"
                    type="number"
                    min="1"
                    placeholder="e.g., 20"
                    value={formData.cigarettesPerPack}
                    onChange={(e) => handleChange("cigarettesPerPack", e.target.value)}
                    required
                    aria-required="true"
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <CardTitle className="text-xl mb-2">Your motivation</CardTitle>
                  <CardDescription>Why do you want to quit smoking?</CardDescription>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reason">Your reason for quitting</Label>
                  <Textarea
                    id="reason"
                    placeholder="e.g., I want to improve my health, save money, and be around for my family..."
                    rows={6}
                    value={formData.reason}
                    onChange={(e) => handleChange("reason", e.target.value)}
                    aria-describedby="reason-hint"
                  />
                  <p id="reason-hint" className="text-sm text-muted-foreground">
                    We'll show you this when you need motivation to stay strong
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-4">
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
                disabled={step === 1}
                className="gap-2"
                aria-label="Go to previous step"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>

              {step < totalSteps ? (
                <Button onClick={handleNext} className="gap-2" aria-label="Go to next step">
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={loading} className="gap-2" aria-label="Complete setup">
                  {loading ? "Setting up..." : "Complete Setup"}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
