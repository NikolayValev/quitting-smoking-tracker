import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount)
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-US").format(num)
}

export function calculateSmokeFreeTime(quitDate: Date) {
  const now = Date.now()
  const quitTime = quitDate.getTime()
  const diffMs = Math.max(0, now - quitTime)

  const minutes = Math.floor(diffMs / (1000 * 60))
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  return {
    minutes,
    hours: hours % 24,
    days,
    totalHours: hours,
  }
}

export function calculateSavings(
  smokeFreeMinutes: number,
  cigarettesPerDay: number,
  costPerPack: number,
  cigarettesPerPack = 20,
): number {
  const days = smokeFreeMinutes / (60 * 24)
  const cigarettesNotSmoked = days * cigarettesPerDay
  return (cigarettesNotSmoked / cigarettesPerPack) * costPerPack
}
