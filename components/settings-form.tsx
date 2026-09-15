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
 * What the savings figure is reckoned from.
 *
 * Shared by onboarding and the account screen so the two cannot drift — the
 * same fields, the same validation, the same words. Onboarding shows it with a
 * heading and a submit that moves on; the account screen shows it in place.
 */
export function SettingsForm({
  settings,
  submitLabel = "Save",
  onSaved,
}: {
  settings: UserSettings
  submitLabel?: string
  onSaved?: () => void
}) {
  const router = useRouter()
  const [baseline, setBaseline] = useState(
    settings.baselinePerDay === null ? "" : String(settings.baselinePerDay),
  )
  const [price, setPrice] = useState(
    settings.pricePerPack === null ? "" : settings.pricePerPack.toFixed(2),
  )
  const [perPack, setPerPack] = useState(String(settings.cigarettesPerPack))
  const [currency, setCurrency] = useState(settings.currency)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  // Shown live, so the number being configured is visible while configuring it.
  const preview = pricePerCigarette({
    baselinePerDay: null,
    pricePerPack: price === "" ? null : Number(price),
    cigarettesPerPack: Number(perPack) || 0,
    currency,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)

    const result = await saveSettings({
      baselinePerDay: baseline === "" ? null : Number(baseline),
      pricePerPack: price === "" ? null : Number(price),
      cigarettesPerPack: Number(perPack),
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

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive" role="alert">
          {error}
        </p>
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

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={busy}>
          {busy ? "Saving…" : submitLabel}
        </Button>
        {saved && <span className="text-sm text-muted-foreground">Saved</span>}
      </div>
    </form>
  )
}
