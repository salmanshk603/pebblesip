/** Compile-time switches for work that ships dark until its phase is done. */
export const FEATURE_FLAGS = {
  /** Premium reminder extras (smart pacing, quiet hours, snooze). Also needs `usePremium()`. */
  premiumReminders: false,
} as const;
