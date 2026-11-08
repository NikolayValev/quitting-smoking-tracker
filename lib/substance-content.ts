import { copingStrategies, wellnessTips, type WellnessTip } from "@/lib/data/wellness-tips"
import { motivationalQuotes, type MotivationalQuote } from "@/lib/data/motivational-quotes"
import {
  cannabisPreparation,
  cannabisQuotes,
  cannabisStrategies,
  cannabisTips,
} from "@/lib/data/cannabis"
import { tracked, type Quitting, type Substance } from "@/lib/substances"

/**
 * Which content goes with which quit. Someone quitting only cannabis should
 * never be told about nicotine patches, and someone quitting both gets both.
 */

export type CopingStrategy = (typeof copingStrategies)[number]

export function strategiesFor(substance: Substance): CopingStrategy[] {
  return substance === "cannabis" ? cannabisStrategies : copingStrategies
}

export function tipsFor(quitting: Quitting): WellnessTip[] {
  return tracked(quitting).flatMap((s) => (s === "cannabis" ? cannabisTips : wellnessTips))
}

export function quotesFor(quitting: Quitting): MotivationalQuote[] {
  return tracked(quitting).flatMap((s) => (s === "cannabis" ? cannabisQuotes : motivationalQuotes))
}

/** The steps stop-smoking services suggest before a quit day. */
const CIGARETTE_PREPARATION = [
  "Pick a day in the next two weeks, ideally not one you expect to be stressful.",
  "Tell the people around you, and ask smokers not to offer you one.",
  "Get nicotine replacement in before the day: a patch, plus gum or lozenges.",
  "The night before, get rid of every cigarette, lighter and ashtray.",
]

/** What to do before the first day, merged for someone quitting both. */
export function preparationFor(quitting: Quitting): string[] {
  if (quitting === "cigarettes") return CIGARETTE_PREPARATION
  if (quitting === "cannabis") return cannabisPreparation
  return [
    "Pick a day in the next two weeks, ideally not one you expect to be stressful.",
    "Tell the people around you, and ask anyone who smokes or uses not to offer.",
    "Get nicotine replacement in before the day: a patch, plus gum or lozenges.",
    "The night before, get rid of every cigarette and lighter, and whatever cannabis, papers and kit you have.",
    "Plan your evenings and your bedtime for the first two weeks, when sleep is hardest.",
  ]
}
