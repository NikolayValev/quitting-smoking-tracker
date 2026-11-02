/**
 * What a push notification says.
 *
 * These appear on lock screens, where anyone nearby can read them, so they
 * name nobody and say nothing about cigarettes or slips. The detail is one tap
 * away, behind the app's sign-in. A test asserts that none of them carry a
 * name, so a later "nicer" version cannot quietly add one.
 */
export type PushMessage = {
  title: string;
  body: string;
  /** Where tapping the notification opens. Always a path inside the app. */
  url: string;
  /** Replaces an earlier notification with the same tag rather than stacking. */
  tag: string;
};

export const CHEER_TEXT = {
  proud: 'Proud of you',
  keep_going: 'Keep going',
  here_for_you: "I'm here if you need me",
} as const;

export type CheerText = keyof typeof CHEER_TEXT;

export function sosMessage(): PushMessage {
  return {
    title: 'Someone you sponsor asked for help',
    body: 'A message or a call now matters more than the right words.',
    url: '/buddies',
    tag: 'sos',
  };
}

export function cheerMessage(kind: CheerText): PushMessage {
  return {
    title: 'Someone is in your corner',
    body: `“${CHEER_TEXT[kind]}”`,
    url: '/buddies',
    tag: 'cheer',
  };
}
