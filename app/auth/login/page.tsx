"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { useState } from "react"
import Link from "next/link"
import { createBrowserClient } from "@supabase/ssr"

type MagicLinkStep = "idle" | "email-sent" | "verified"

export default function LoginPage() {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [magicStep, setMagicStep] = useState<MagicLinkStep>("idle")
  const [isEmailLoading, setIsEmailLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true)
    setError(null)

    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
      const redirectUri = `${siteUrl || window.location.origin}/auth/callback`

      const googleAuthUrl = new URL(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/authorize`)
      googleAuthUrl.searchParams.set("provider", "google")
      googleAuthUrl.searchParams.set("redirect_to", redirectUri)

      window.location.href = googleAuthUrl.toString()
    } catch (err: unknown) {
      console.error("OAuth initialization error:", err)
      setError(err instanceof Error ? err.message : "An error occurred")
      setIsGoogleLoading(false)
    }
  }

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsEmailLoading(true)
    setError(null)

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    })

    setIsEmailLoading(false)

    if (otpError) {
      setError(otpError.message)
      return
    }

    setMagicStep("email-sent")
  }

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) return
    setIsEmailLoading(true)
    setError(null)

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "email",
    })

    setIsEmailLoading(false)

    if (verifyError) {
      setError(verifyError.message)
      return
    }

    window.location.href = "/dashboard"
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome Back</CardTitle>
            <CardDescription>Sign in to continue your smoke-free journey</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md" role="alert">
                  {error}
                </div>
              )}

              <Button onClick={handleGoogleLogin} disabled={isGoogleLoading} className="w-full" size="lg">
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                {isGoogleLoading ? "Signing in..." : "Continue with Google"}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">or</span>
                </div>
              </div>

              {magicStep === "idle" && (
                <form onSubmit={handleSendOtp} className="flex flex-col gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" variant="outline" className="w-full" disabled={isEmailLoading}>
                    {isEmailLoading ? "Sending..." : "Send magic code"}
                  </Button>
                </form>
              )}

              {magicStep === "email-sent" && (
                <div className="flex flex-col gap-3 items-center">
                  <p className="text-sm text-muted-foreground text-center">
                    Check <strong>{email}</strong> for a 6-digit code
                  </p>
                  <InputOTP maxLength={6} value={otp} onChange={(val) => { setOtp(val); if (val.length === 6) handleVerifyOtp() }}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                  {isEmailLoading && <p className="text-sm text-muted-foreground">Verifying...</p>}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setMagicStep("idle"); setOtp(""); setError(null) }}
                  >
                    Use a different email
                  </Button>
                </div>
              )}

              <p className="text-center text-xs text-muted-foreground">
                By signing in, you agree to our{" "}
                <Link href="/terms" className="underline underline-offset-4 hover:text-primary">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="underline underline-offset-4 hover:text-primary">
                  Privacy Policy
                </Link>
              </p>
            </div>
          </CardContent>
          <CardFooter />
        </Card>
      </div>
    </div>
  )
}
