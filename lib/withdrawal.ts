/**
 * What nicotine withdrawal usually feels like on a given day of a quit.
 *
 * The point is to make a bad afternoon legible: irritability on day two is the
 * expected peak, not a sign that quitting is going wrong. Wording follows the
 * NHS and smokefree.gov accounts — symptoms peak in the first three days, as
 * nicotine leaves the body, and most fade within about a month — and says
 * "usually" because everyone's is different.
 */
export type WithdrawalPhase = {
  id: string
  /** Inclusive lower bound, in whole smoke-free days. */
  fromDay: number
  title: string
  body: string
}

export const WITHDRAWAL_PHASES: WithdrawalPhase[] = [
  {
    id: "day-one",
    fromDay: 0,
    title: "Day one",
    body: "Cravings come often today, every hour or so is normal, and each one lasts a few minutes. Get through them one at a time.",
  },
  {
    id: "peak",
    fromDay: 1,
    title: "Days two and three are usually the hardest",
    body: "Irritability, restlessness, headaches and trouble concentrating peak now, while nicotine leaves your body. This is the hardest stretch, and the shortest.",
  },
  {
    id: "habit",
    fromDay: 3,
    title: "The nicotine is out of your body",
    body: "From here, most cravings come from routine: coffee, meals, the car, a drink. Plan for those moments. A worse cough this week is common as your lungs start clearing.",
  },
  {
    id: "week-two",
    fromDay: 7,
    title: "The physical part is easing",
    body: "Cravings are less frequent, though they can still be strong. Sleep and appetite may be off for a while yet; that is normal.",
  },
  {
    id: "weeks-three-four",
    fromDay: 14,
    title: "Most withdrawal fades this month",
    body: "Cravings now arrive with particular moments rather than all day. Each one you sit through makes the next one weaker.",
  },
  {
    id: "just-one",
    fromDay: 30,
    title: "Watch for “just one”",
    body: "This is when you feel past it, and one cigarette starts to sound harmless. It is how most quits end. Be careful with drinks and bad days.",
  },
  {
    id: "behind-you",
    fromDay: 90,
    title: "It is mostly behind you",
    body: "Cravings are rare now, and short. An occasional strong one, even years from now, is normal and passes like the others.",
  },
]

/** The phase for someone `days` whole days into a smoke-free streak. */
export function withdrawalPhase(days: number): WithdrawalPhase {
  let phase = WITHDRAWAL_PHASES[0]
  for (const candidate of WITHDRAWAL_PHASES) {
    if (days >= candidate.fromDay) phase = candidate
  }
  return phase
}
