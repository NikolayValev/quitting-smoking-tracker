export type WellnessTip = {
  id: string
  category: "health" | "motivation" | "coping" | "financial" | "lifestyle"
  title: string
  description: string
  longDescription?: string
}

export const wellnessTips: WellnessTip[] = [
  {
    id: "1",
    category: "health",
    title: "Your lungs are healing",
    description: "Within 2-12 weeks, your circulation improves and lung function increases.",
    longDescription:
      "After quitting smoking, your body begins to heal almost immediately. Within 2-12 weeks of being smoke-free, your blood circulation improves significantly, making physical activity easier. Your lung function also begins to increase, allowing you to breathe more easily and deeply.",
  },
  {
    id: "2",
    category: "motivation",
    title: "Every craving passes",
    description: "Most cravings last only 3-5 minutes. You can outlast them.",
    longDescription:
      "Remember that cravings are temporary. Most cravings peak within 3-5 minutes and then subside. Each time you successfully resist a craving, you are rewiring your brain and making it easier to stay smoke-free.",
  },
  {
    id: "3",
    category: "coping",
    title: "Deep breathing helps",
    description: "Practice deep breathing exercises when cravings strike.",
    longDescription:
      "Deep breathing is one of the most effective ways to manage cravings and stress. Take slow, deep breaths through your nose, hold for a few seconds, and exhale slowly through your mouth. This activates your parasympathetic nervous system and helps you relax.",
  },
  {
    id: "4",
    category: "financial",
    title: "Calculate your savings",
    description: "Track how much money you are saving by not buying cigarettes.",
    longDescription:
      "One of the most tangible benefits of quitting smoking is the money you save. Calculate your daily, weekly, and monthly savings. Consider setting aside that money for something special as a reward for your commitment to being smoke-free.",
  },
  {
    id: "5",
    category: "lifestyle",
    title: "Stay hydrated",
    description: "Drinking water helps flush out toxins and reduces cravings.",
    longDescription:
      "Staying well-hydrated is crucial during your quit journey. Water helps flush nicotine and other toxins from your body more quickly. When you feel a craving, try drinking a glass of water - it can help reduce the intensity of the urge.",
  },
  {
    id: "6",
    category: "health",
    title: "Taste and smell return",
    description: "Your senses of taste and smell will improve within days.",
    longDescription:
      "Within just 48 hours of quitting, nerve endings begin to regrow and your senses of taste and smell start to improve. Food will taste better, and you will notice scents you may have missed for years.",
  },
  {
    id: "7",
    category: "motivation",
    title: "You are stronger than you think",
    description: "Each smoke-free day proves your strength and commitment.",
    longDescription:
      "Every day that you remain smoke-free is a testament to your inner strength. You are breaking free from addiction and choosing health and freedom. Be proud of your progress, no matter how small it may seem.",
  },
  {
    id: "8",
    category: "coping",
    title: "Avoid triggers",
    description: "Identify and avoid situations that make you want to smoke.",
    longDescription:
      "Recognize the people, places, and situations that trigger your desire to smoke. In the early days of quitting, try to avoid these triggers when possible. Over time, you will learn to manage these situations without smoking.",
  },
]

export const copingStrategies = [
  {
    id: "1",
    title: "The 5-4-3-2-1 Grounding Technique",
    description: "Use your senses to ground yourself when cravings hit",
    steps: [
      "5 things you can see",
      "4 things you can touch",
      "3 things you can hear",
      "2 things you can smell",
      "1 thing you can taste",
    ],
  },
  {
    id: "2",
    title: "Delay and Distract",
    description: "Put off smoking for 10 minutes and keep your mind busy",
    steps: [
      "Tell yourself to wait 10 minutes",
      "Call a friend or family member",
      "Go for a short walk",
      "Drink a glass of water",
      "The craving will likely pass",
    ],
  },
  {
    id: "3",
    title: "Deep Breathing Exercise",
    description: "Calm your mind and body with controlled breathing",
    steps: [
      "Breathe in slowly through your nose for 4 seconds",
      "Hold your breath for 4 seconds",
      "Exhale slowly through your mouth for 6 seconds",
      "Repeat 5 times",
      "Notice how your body relaxes",
    ],
  },
  {
    id: "4",
    title: "Physical Activity",
    description: "Move your body to release endorphins and reduce cravings",
    steps: [
      "Do 10 jumping jacks",
      "Take a quick walk around the block",
      "Stretch for 5 minutes",
      "Dance to your favorite song",
      "Any movement helps",
    ],
  },
]

export const relaxationTechniques = [
  {
    id: "1",
    title: "Box Breathing",
    duration: "5 minutes",
    description: "A calming technique used by Navy SEALs to reduce stress",
    image: "/placeholder.svg?height=200&width=400",
  },
  {
    id: "2",
    title: "Progressive Muscle Relaxation",
    duration: "10 minutes",
    description: "Systematically tense and relax muscle groups throughout your body",
    image: "/placeholder.svg?height=200&width=400",
  },
  {
    id: "3",
    title: "Guided Visualization",
    duration: "8 minutes",
    description: "Imagine a peaceful place to calm your mind and body",
    image: "/placeholder.svg?height=200&width=400",
  },
  {
    id: "4",
    title: "Body Scan Meditation",
    duration: "12 minutes",
    description: "Bring awareness to each part of your body for deep relaxation",
    image: "/placeholder.svg?height=200&width=400",
  },
]

export const milestoneDefinitions = [
  { type: "20_minutes", label: "20 Minutes", description: "Heart rate drops to normal" },
  { type: "12_hours", label: "12 Hours", description: "Carbon monoxide level in blood drops to normal" },
  { type: "24_hours", label: "1 Day", description: "Chance of heart attack decreases" },
  { type: "48_hours", label: "2 Days", description: "Nerve endings start regrowing, taste and smell improve" },
  { type: "72_hours", label: "3 Days", description: "Breathing becomes easier, bronchial tubes relax" },
  { type: "1_week", label: "1 Week", description: "You have made it through the hardest part!" },
  { type: "2_weeks", label: "2 Weeks", description: "Circulation improves, lung function increases" },
  { type: "1_month", label: "1 Month", description: "Coughing and shortness of breath decrease" },
  { type: "3_months", label: "3 Months", description: "Lung function improves by up to 30%" },
  { type: "6_months", label: "6 Months", description: "Cilia in lungs regrow, reducing infection risk" },
  { type: "1_year", label: "1 Year", description: "Heart disease risk is cut in half" },
  { type: "5_years", label: "5 Years", description: "Stroke risk reduced to that of a non-smoker" },
  { type: "10_years", label: "10 Years", description: "Lung cancer risk drops by 50%" },
]
