"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { saveSettings } from "@/app/settings/actions"
import { QuittingChoice } from "@/components/quitting-choice"
import { tracked, type Quitting } from "@/lib/substances"
import {
  formatMoney,
  pricePerCigarette,
  type UserSettings,
} from "@/lib/user-settings"

/**
 * A short list rather than every ISO 4217 code. A dropdown of 180 entries is
 * worse to use than one of eight, and anything missing can be added the moment
 * somebody needs it.
 */
const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD", "NZD", "SEK", "PLN"]

/**
 * What is being quit, and what the savings figures are reckoned from.
 *
 * Shared by onboarding and the account screen so the two cannot drift — the
 * same fields, the same validation, the same words. Onboarding asks what is
 * being quit as a step of its own and passes the answer in as `quitting`; the
 * account screen shows the choice at the top of the form.
 */
export function SettingsForm({
  settings,
  quitting: fixedQuitting,
  submitLabel = "Save",
  onSaved,
}: {
  settings: UserSettings
  /** Already chosen elsewhere, so not asked again here. */
  quitting?: Quitting
  submitLabel?: string
  onSaved?: () => void
}) {
  const router = useRouter()
  const [chosen, setChosen] = useState<Quitting>(settings.quitting)
  const quitting = fixedQuitting ?? chosen
  const substances = tracked(quitting)
  const cigarettes = substances.includes("cigarettes")
  const cannabis = substances.includes("cannabis")

  const [baseline, setBaseline] = useState(
    settings.baselinePerDay === null ? "" : String(settings.baselinePerDay),
  )
  const [price, setPrice] = useState(
    settings.pricePerPack === null ? "" : settings.pricePerPack.toFixed(2),
  )
  const [perPack, setPerPack] = useState(String(settings.cigarettesPerPack))
  const [sessions, setSessions] = useState(
    settings.sessionsPerDay === null ? "" : String(settings.sessionsPerDay),
  )
  const [sessionPrice, setSessionPrice] = useState(
    settings.pricePerSession === null ? "" : settings.pricePerSession.toFixed(2),
  )
  const [currency, setCurrency] = useState(settings.currency)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  // Shown live, so the number being configured is visible while configuring it.
  const preview = pricePerCigarette({
    pricePerPack: price === "" ? null : Number(price),
    cigarettesPerPack: Number(perPack) || 0,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)

    // Only the fields on screen. A substance someone has stopped tracking
    // keeps its settings, in case they switch back.
    const result = await saveSettings({
      ...(fixedQuitting ? {} : { quitting }),
      ...(cigarettes
        ? {
            baselinePerDay: baseline === "" ? null : Number(baseline),
            pricePerPack: price === "" ? null : Number(price),
            cigarettesPerPack: Number(perPack),
          }
        : {}),
      ...(cannabis
        ? {
            sessionsPerDay: sessions === "" ? null : Number(sessions),
            pricePerSession: sessionPrice === "" ? null : Number(sessionPrice),
          }
        : {}),
      currency,
    })

    setBusy(false)
    if (!result.success) {
      setError(result.error)
      return
    }

    setSaved(true)
    router.refresh()
    onSaved?.()
  }

  const currencyField = (
    <div className="space-y-1.5 sm:col-span-1">
      <Label htmlFor="currency">Currency</Label>
      <Select value={currency} onValueChange={setCurrency}>
        <SelectTrigger id="currency">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {CURRENCIES.map((code) => (
            <SelectItem key={code} value={code}>
              {code}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      {!fixedQuitting && (
        <div>
          <QuittingChoice
            value={chosen}
            onChange={(value) => { setChosen(value); setSaved(false) }}
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Changing this keeps everything you have logged.
          </p>
        </div>
      )}

      {cigarettes && (
        <fieldset className="space-y-5">
          {/* Named only when there are two groups to tell apart. */}
          {cannabis && (
            <legend className="mb-3 text-base font-medium tracking-tight">Cigarettes</legend>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="baseline">Cigarettes a day before you quit</Label>
            <Input
              id="baseline"
              type="number"
              min="1"
              max="200"
              inputMode="numeric"
              placeholder="20"
              value={baseline}
              onChange={(e) => { setBaseline(e.target.value); setError(null) }}
            />
            <p className="text-xs text-muted-foreground">
              Used to work out what you have avoided. Left blank, we average the days you
              logged while still smoking.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {currencyField}

            <div className="space-y-1.5 sm:col-span-1">
              <Label htmlFor="price">Price of a pack</Label>
              <Input
                id="price"
                type="number"
                min="0.01"
                step="0.01"
                inputMode="decimal"
                placeholder="12.00"
                value={price}
                onChange={(e) => { setPrice(e.target.value); setError(null) }}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-1">
              <Label htmlFor="per-pack">Cigarettes in a pack</Label>
              <Input
                id="per-pack"
                type="number"
                min="1"
                max="100"
                inputMode="numeric"
                value={perPack}
                onChange={(e) => { setPerPack(e.target.value); setError(null) }}
              />
            </div>
          </div>

          {preview !== null && (
            <p className="text-sm text-muted-foreground">
              That works out at {formatMoney(preview, currency)} a cigarette.
            </p>
          )}
        </fieldset>
      )}

      {cannabis && (
        // The rule sits on a wrapper: a legend does not lay out inside a
        // fieldset's own border the way a block would.
        <div className={cigarettes ? "border-t border-border/60 pt-5" : undefined}>
          <fieldset className="space-y-5">
            {cigarettes && (
              <legend className="mb-3 text-base font-medium tracking-tight">Cannabis</legend>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="sessions-per-day">Times a day you used cannabis</Label>
              <Input
                id="sessions-per-day"
                type="number"
                min="1"
                max="50"
                inputMode="numeric"
                placeholder="2"
                value={sessions}
                onChange={(e) => { setSessions(e.target.value); setError(null) }}
              />
              <p className="text-xs text-muted-foreground">
                Count each joint, bowl, vape or edible as one. Left blank, we average the
                days you logged while still using.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {/* The currency is shared, and asked once. */}
              {!cigarettes && currencyField}

              <div className="space-y-1.5 sm:col-span-1">
                <Label htmlFor="session-price">What one session cost</Label>
                <Input
                  id="session-price"
                  type="number"
                  min="0.01"
                  step="0.01"
                  inputMode="decimal"
                  placeholder="5.00"
                  value={sessionPrice}
                  onChange={(e) => { setSessionPrice(e.target.value); setError(null) }}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              A rough figure is fine: what you spent in a week, divided by the times you used.
            </p>
          </fieldset>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={busy}>
          {busy ? "Saving…" : submitLabel}
        </Button>
        {saved && <span className="text-sm text-muted-foreground">Saved</span>}
      </div>
    </form>
  )
}
