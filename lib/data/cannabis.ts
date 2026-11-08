import type { WellnessTip } from "@/lib/data/wellness-tips"
import type { MotivationalQuote } from "@/lib/data/motivational-quotes"
import type { WithdrawalPhase } from "@/lib/withdrawal"

/**
 * Everything the app says about stopping cannabis.
 *
 * Its own content rather than the cigarette copy relabelled: the withdrawal
 * runs on a different clock, the triggers are different moments, and there is
 * no nicotine replacement to point at. Claims are kept to what the clinical
 * literature supports: cannabis withdrawal is a recognised syndrome (DSM-5),
 * about half of regular users get it (Bahji et al., JAMA Network Open 2020),
 * it usually starts within a day or two, peaks in the first week and eases
 * over the next one or two, with sleep problems and vivid dreams lasting
 * longest (Budney et al.). Talking therapies help (Cochrane, Gates et al.
 * 2016); no medicine is licensed for it.
 */

export const CANNABIS_WITHDRAWAL: WithdrawalPhase[] = [
  {
    id: "first-days",
    fromDay: 0,
    title: "The first day or two",
    body: "Withdrawal usually starts a day or two after the last time, so today may feel easier than this week will. Use it to plan your evening and your bedtime.",
  },
  {
    id: "peak",
    fromDay: 1,
    title: "This week is usually the hardest",
    body: "Irritability, anxiety, restlessness, a poor appetite and trouble sleeping usually peak in the first week. Some people get sweats, headaches or an upset stomach. It is withdrawal, and it passes.",
  },
  {
    id: "easing",
    fromDay: 7,
    title: "Most of it eases this week",
    body: "Mood and appetite usually settle by the end of the second week. Sleep is often the last thing to recover, so a rough night now is still normal.",
  },
  {
    id: "sleep",
    fromDay: 14,
    title: "Sleep is the slow part",
    body: "Trouble falling asleep and vivid, strange dreams can last a month or more. Both are known parts of stopping, and both fade. Keep a regular bedtime and go easy on caffeine late in the day.",
  },
  {
    id: "just-one",
    fromDay: 30,
    title: "Watch for “just one”",
    body: "This is when it feels under control and one would seem harmless. Be careful with the people and the evenings you used to use with.",
  },
  {
    id: "behind-you",
    fromDay: 90,
    title: "It is mostly behind you",
    body: "Cravings are rare now. A strong one now and then, often when you are stressed, is normal and passes like the others.",
  },
]

/**
 * Plans for the moments cannabis is tied to. As with cigarettes, a craving
 * that comes at the same time every day is a cue, and the answer is to change
 * the routine around it. The ids are craving triggers, so they must not
 * collide with the cigarette ones.
 */
export const cannabisStrategies = [
  {
    id: "wind-down",
    title: "Winding down in the evening",
    description: "When the evening used to start with one",
    steps: [
      "Change the first half hour home: shower, cook, or go for a walk",
      "Find something else that marks the end of the day, like a tea, a bath or a show you save for then",
      "Keep your hands busy for the hour it used to fill",
      "Sit it out: the urge rises, peaks and fades",
    ],
  },
  {
    id: "sleep",
    title: "To get to sleep",
    description: "When it was how you switched off",
    steps: [
      "Go to bed and get up at the same time every day, even after a bad night",
      "No caffeine after midday, and screens off half an hour before bed",
      "If you are still awake after twenty minutes, get up and do something dull until you are sleepy",
      "Expect strange dreams for a few weeks. Dream sleep is coming back, and they settle",
    ],
  },
  {
    id: "friends",
    title: "With people who use",
    description: "Friends, a party, someone passing one round",
    steps: [
      "Tell them you have stopped before it is offered",
      "Have your answer ready: “I’m good, thanks”",
      "Meet somewhere you can’t use, or leave before it starts",
      "Bring someone who knows you are stopping",
    ],
  },
  {
    id: "boredom",
    title: "When there is nothing to do",
    description: "Weekends, days off, empty evenings",
    steps: [
      "Plan the empty hours in advance, even loosely",
      "Get out of the room you used to use in",
      "Do something with your hands: cook, play, exercise",
      "Message someone instead",
    ],
  },
  {
    id: "low-mood",
    title: "When you feel anxious or low",
    description: "Worry, stress, a bad day",
    steps: [
      "Breathe in for 4, out for 6, five times",
      "Remember that anxiety and low mood are part of withdrawal in the first weeks, and they ease",
      "Name what is actually wrong, out loud or on paper",
      "If it has not lifted after a few weeks, talk to a doctor",
    ],
  },
]

export const cannabisTips: WellnessTip[] = [
  {
    id: "cannabis-withdrawal-real",
    category: "health",
    title: "Cannabis withdrawal is real",
    description:
      "Irritability, anxiety, poor sleep and a low appetite in the first week are recognised withdrawal symptoms, not a sign that something is wrong with you.",
    longDescription:
      "About half of people who use cannabis regularly get withdrawal symptoms when they stop. They usually start within a day or two, are at their worst in the first week, and ease over the next one or two. Sleep problems often last longest. Knowing what they are makes them easier to sit out.",
  },
  {
    id: "cannabis-dreams",
    category: "health",
    title: "Vivid dreams are expected",
    description:
      "Cannabis suppresses dream sleep. When you stop, it comes back strongly for a few weeks, so intense, strange dreams are common. They settle.",
  },
  {
    id: "cannabis-sleep-routine",
    category: "lifestyle",
    title: "Give sleep a routine",
    description:
      "The same bedtime and wake time, no caffeine after midday, no screens in bed. Sleep is the hardest part of the first weeks, and a routine shortens it.",
  },
  {
    id: "cannabis-appetite",
    category: "health",
    title: "Eat even if you are not hungry",
    description:
      "Appetite often drops in the first week. Regular small meals keep your energy and your mood steadier while it comes back.",
  },
  {
    id: "cannabis-clear-out",
    category: "lifestyle",
    title: "Get rid of all of it",
    description:
      "What you have left, and the papers, grinder, pipe or vape. Every one is a cue. Think about deleting the number you buy from.",
  },
  {
    id: "cannabis-therapy",
    category: "coping",
    title: "Talking therapy helps",
    description:
      "Cognitive behavioural therapy and similar support make stopping more likely. A doctor or a local drug service can refer you, often for free.",
  },
  {
    id: "cannabis-money",
    category: "financial",
    title: "Put the money where you can see it",
    description:
      "Move what you would have spent each week into a separate account. Money you can see is a better reason than a number on a screen.",
  },
  {
    id: "cannabis-slip",
    category: "motivation",
    title: "One time is a slip, not a relapse",
    description:
      "If you use, record it honestly, work out what set it off, and start again tomorrow. The days you went without still happened.",
  },
]

/** The help that measurably changes outcomes, as quit-support.tsx shows it. */
export const cannabisSupport = [
  {
    title: "Talking therapy",
    body: "Cognitive behavioural therapy and motivational support make stopping more likely. A doctor or a local drug service can refer you, usually for free.",
  },
  {
    title: "Your doctor",
    body: "No medicine is licensed for cannabis withdrawal, but a doctor can help with sleep or anxiety that is still there after the first few weeks.",
  },
  {
    title: "Free, confidential helplines",
    body: "They will not judge you or pass anything on, and they can tell you what support is near you.",
  },
]

/** Steps before the first day, shown before any check-in. */
export const cannabisPreparation = [
  "Pick a day in the next two weeks, ideally not just before something stressful.",
  "Tell the people you use with, and ask them not to offer.",
  "The night before, get rid of what you have, and the papers, grinder, pipe or vape.",
  "Plan your evenings and your bedtime for the first two weeks, when sleep is hardest.",
]

export const cannabisQuotes: MotivationalQuote[] = [
  { quote: "The craving will pass whether you use or not." },
  { quote: "The first week is the hardest, and it ends." },
  { quote: "A bad night’s sleep this week is withdrawal. It is not how it will stay." },
  { quote: "Not tonight. Just for tonight." },
]
