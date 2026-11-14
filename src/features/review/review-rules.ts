/** PRD §5.11: Play in-app review after a 3-day streak or the first goal met; max once per 30 days. */
export const REVIEW_KEY = 'review_last_asked';
export const REVIEW_GAP_MS = 30 * 24 * 60 * 60 * 1000;

/** Pure decision, unit-tested (kept free of native imports). */
export function shouldAskForReview(
  lastAsked: number | null,
  streak: number,
  goalMetToday: boolean,
  now: number,
): boolean {
  if (lastAsked !== null && now - lastAsked < REVIEW_GAP_MS) return false;
  return streak >= 3 || goalMetToday;
}
