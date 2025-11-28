"use client"

import { useEffect, useState } from "react"

const motivationalQuotes = [
  {
    quote: "You are stronger than your cravings",
    author: "Your Future Self",
  },
  {
    quote: "Every moment smoke-free is a victory worth celebrating",
    author: "Wellness Wisdom",
  },
  {
    quote: "The best time to quit was yesterday. The second best time is now.",
    author: "Ancient Proverb",
  },
  {
    quote: "Your health is an investment, not an expense",
    author: "Wellness Guide",
  },
  {
    quote: "Each day smoke-free brings you closer to the person you want to be",
    author: "Your Journey",
  },
]

export function MotivationalHero() {
  const [quote, setQuote] = useState(motivationalQuotes[0])

  useEffect(() => {
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24),
    )
    const quoteIndex = dayOfYear % motivationalQuotes.length
    setQuote(motivationalQuotes[quoteIndex])
  }, [])

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-8 md:p-12">
      <div className="relative z-10 max-w-3xl">
        <div className="space-y-4">
          <div className="inline-block px-4 py-1.5 bg-primary-foreground/20 rounded-full text-sm font-medium backdrop-blur-sm">
            Daily Motivation
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-balance leading-tight">{quote.quote}</h2>
          <p className="text-lg text-primary-foreground/80">— {quote.author}</p>
        </div>
      </div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary-foreground/10 rounded-full blur-3xl -z-0" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary-foreground/10 rounded-full blur-3xl -z-0" />
    </div>
  )
}
