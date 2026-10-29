export type WellnessTip = {
  id: string
  category: "health" | "motivation" | "coping" | "financial" | "lifestyle"
  title: string
  description: string
  longDescription?: string
}

/**
 * Advice specific to cigarettes. Each one is something a person quitting would
 * not necessarily know, and each is stated no more strongly than the evidence
 * for it (NHS Better Health, smokefree.gov, Cochrane reviews of NRT).
 *
 * Generic wellness lines ("stay hydrated") were here before and have gone: they
 * read the same in any app and told nobody anything.
 */
export const wellnessTips: WellnessTip[] = [
  {
    id: "coffee",
    category: "coping",
    title: "Your coffee is stronger now",
    description:
      "Smoking makes your body clear caffeine much faster. Once you stop, the same cup can leave you jittery — try half-strength for the first few weeks.",
    longDescription:
      "Tobacco smoke speeds up the liver enzyme that breaks down caffeine. When you stop smoking, caffeine stays in your blood far longer, so your usual coffee can feel like a double. The jitters, racing heart and poor sleep that follow are easy to mistake for withdrawal. Cutting back to half-strength or switching some cups to decaf for the first few weeks helps.",
  },
  {
    id: "cough",
    category: "health",
    title: "The cough can get worse before it gets better",
    description:
      "The hairs that sweep your airways start working again, and clearing what has built up often means more coughing for a few weeks.",
    longDescription:
      "Smoking paralyses the cilia, the tiny hairs that move mucus out of your lungs. As they recover, they start clearing what has collected, and a cough that is worse for the first few weeks is a common sign of that. It usually settles. See a doctor if it lasts more than a month, gets steadily worse, or you cough up blood.",
  },
  {
    id: "three-days",
    category: "health",
    title: "Nicotine is out of your body in about three days",
    description:
      "Physical withdrawal peaks in the first three days. After that, most of what you are fighting is habit.",
    longDescription:
      "Irritability, restlessness, poor concentration and strong cravings are usually at their worst on days two and three, while nicotine leaves your system. From then on, cravings are mostly triggered by the moments you used to smoke in — coffee, meals, the car, a drink — which is why planning for those moments matters more than willpower.",
  },
  {
    id: "not-a-puff",
    category: "motivation",
    title: "Not a single puff",
    description:
      "“Just one” is how most quit attempts end. The rule that works is not one puff, not once.",
    longDescription:
      "A single cigarette restarts the cycle of withdrawal and relief that the habit runs on, and most people who have “just one” are smoking regularly again within weeks. Treat any cigarette as off-limits rather than as a treat you have earned.",
  },
  {
    id: "nrt",
    category: "coping",
    title: "Nicotine replacement improves your odds",
    description:
      "Patches, gum, lozenges and sprays raise the chance of quitting by around half. A patch plus a fast-acting one works better than either alone.",
    longDescription:
      "Nicotine replacement takes the edge off withdrawal without the smoke. Used properly it increases the chance of quitting for good by roughly 50–60% compared with going without, and combining a daily patch with gum or a lozenge for sudden cravings works better than one product. A pharmacist can advise on strength; in many places it is free or cheap through stop-smoking services.",
  },
  {
    id: "alcohol",
    category: "lifestyle",
    title: "Drinking is the biggest trap",
    description:
      "Alcohol lowers your guard and is tied to smoking for a lot of people. Drink less for the first few weeks, or somewhere you can’t smoke.",
    longDescription:
      "More slips happen with a drink in hand than anywhere else. For the first month, cut down, stay inside rather than heading out with the smokers, and decide before you go out that you are not having one.",
  },
  {
    id: "hands",
    category: "lifestyle",
    title: "Give your hands something to do",
    description:
      "A cigarette is also something to hold and a reason to step outside. Keep a pen, a straw or sugar-free gum where your cigarettes used to be.",
  },
  {
    id: "clear-out",
    category: "lifestyle",
    title: "Clear out the lighters and the emergency pack",
    description:
      "Lighters, ashtrays, the pack in the glovebox. Every one is a cue, and the one you keep “just in case” is the one you’ll smoke.",
  },
  {
    id: "appetite",
    category: "health",
    title: "Being hungrier is normal",
    description:
      "Nicotine dulls appetite. Many people gain a few kilos after quitting — keep crunchy, low-sugar snacks to hand, and know the health gain far outweighs it.",
  },
  {
    id: "sleep",
    category: "health",
    title: "Sleep may be rough for a week or two",
    description:
      "Vivid dreams and waking in the night are common early withdrawal symptoms, and the stronger coffee doesn’t help. Both settle within weeks.",
  },
  {
    id: "pack-money",
    category: "financial",
    title: "Move a pack’s worth aside every day",
    description:
      "Transfer what you would have spent into a separate account. Money you can see is a better reason than a number on a screen.",
  },
  {
    id: "slip",
    category: "motivation",
    title: "A slip is not a relapse",
    description:
      "If you smoke one, log it honestly, work out what set it off, and make tomorrow smoke-free. The days you went without still happened.",
  },
]

/**
 * Plans for the moments cigarettes are tied to. A craving that arrives at the
 * same time every day is a habit cue, and a cue needs a different answer than
 * willpower: change the routine around it.
 *
 * The ids are sent to analytics as the craving signal, so they name the trigger
 * rather than a position in the list.
 */
export const copingStrategies = [
  {
    id: "morning",
    title: "The first one of the morning",
    description: "Usually the strongest craving of the day",
    steps: [
      "Change the order: shower or brush your teeth before anything else",
      "If you use a patch, put it on as soon as you wake",
      "Have breakfast somewhere you never smoked",
      "Keep the first ten minutes busy — it peaks early and fades fast",
    ],
  },
  {
    id: "coffee",
    title: "With coffee",
    description: "When the cup and the cigarette always went together",
    steps: [
      "Drink it somewhere new, or switch to tea for the first few weeks",
      "Make it half-strength — caffeine hits harder once you stop smoking",
      "Hold the cup in the hand you smoked with",
      "Get up as soon as it’s finished",
    ],
  },
  {
    id: "after-meal",
    title: "After a meal",
    description: "The one that used to end every meal",
    steps: [
      "Get up from the table as soon as you finish",
      "Brush your teeth or chew mint gum",
      "Wash up, or walk for five minutes",
      "By the time you’re done, the urge usually is too",
    ],
  },
  {
    id: "driving",
    title: "In the car",
    description: "Traffic, the commute, the long drive",
    steps: [
      "Clean the car and take out the lighter and any pack",
      "Keep gum, water or something crunchy within reach",
      "Change the playlist, or call someone hands-free",
      "Take a different route for the first few weeks",
    ],
  },
  {
    id: "drink",
    title: "With a drink",
    description: "Where most slips happen",
    steps: [
      "Decide before you go out that you’re not having one",
      "Hold your drink in the hand you smoked with",
      "Stay inside when the smokers head out",
      "Alternate with water, and leave a little earlier than usual",
    ],
  },
  {
    id: "break",
    title: "On a break, or around smokers",
    description: "When stepping outside meant lighting up",
    steps: [
      "Take your break somewhere else, or walk instead",
      "Tell the people you smoked with that you’ve stopped",
      "Take a drink or a snack with you",
      "Leave before it turns into standing around",
    ],
  },
  {
    id: "stress",
    title: "When something goes wrong",
    description: "Stress, an argument, bad news",
    steps: [
      "Breathe in for 4, out for 6, five times",
      "Remember: smoking eased the withdrawal it caused, not the problem",
      "Name what is actually wrong, out loud or on paper",
      "Wait ten minutes before deciding anything",
    ],
  },
]

/**
 * Timed sessions, each aimed at something withdrawal actually does: the
 * restlessness of the first days, the urge itself, physical tension, and the
 * broken sleep of the first week or two.
 */
export const relaxationTechniques = [
  {
    id: "box-breathing",
    title: "Box breathing",
    duration: "5 minutes",
    minutes: 5,
    description:
      "In for 4, hold for 4, out for 4, hold for 4. For the restless, on-edge stretch of the first few days.",
  },
  {
    id: "urge-surfing",
    title: "Urge surfing",
    duration: "8 minutes",
    minutes: 8,
    description:
      "Notice where the craving sits in your body and watch it rise, peak and fall without acting on it. Most are gone before the timer is.",
  },
  {
    id: "muscle-relaxation",
    title: "Progressive muscle relaxation",
    duration: "10 minutes",
    minutes: 10,
    description:
      "Tense each muscle group for five seconds, then let go, from your feet up. For the tension that withdrawal leaves in your jaw and shoulders.",
  },
  {
    id: "sleep",
    title: "Wind down for sleep",
    duration: "12 minutes",
    minutes: 12,
    description:
      "A slow body scan in bed, lights off. Sleep is often broken for the first week or two after quitting, and this helps you drift back off.",
  },
]

export const milestoneDefinitions = [
  { type: "20_minutes", label: "20 Minutes", description: "Heart rate drops to normal" },
  { type: "12_hours", label: "12 Hours", description: "Carbon monoxide level in blood drops to normal" },
  { type: "24_hours", label: "1 Day", description: "Chance of heart attack decreases" },
  { type: "48_hours", label: "2 Days", description: "Nerve endings start regrowing, taste and smell improve" },
  { type: "72_hours", label: "3 Days", description: "Breathing becomes easier, bronchial tubes relax" },
  { type: "1_week", label: "1 Week", description: "Physical withdrawal is past its peak; what is left is mostly habit" },
  { type: "2_weeks", label: "2 Weeks", description: "Circulation improves, lung function increases" },
  { type: "1_month", label: "1 Month", description: "Coughing and shortness of breath decrease" },
  { type: "3_months", label: "3 Months", description: "Circulation and lung function keep improving; exercise gets easier" },
  { type: "6_months", label: "6 Months", description: "Cilia have recovered; fewer chest infections and less phlegm" },
  { type: "1_year", label: "1 Year", description: "Heart disease risk is cut in half" },
  { type: "5_years", label: "5 Years", description: "Stroke risk reduced to that of a non-smoker" },
  { type: "10_years", label: "10 Years", description: "Lung cancer risk is about half that of someone still smoking" },
]
