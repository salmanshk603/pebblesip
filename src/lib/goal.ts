// prd.md §5.1. General guidance, not medical advice.
export type ActivityLevel = 'low' | 'moderate' | 'high';
export type Climate = 'cool' | 'mild' | 'hot';

export const ACTIVITY_FACTOR: Record<ActivityLevel, number> = {
  low: 1.0,
  moderate: 1.1,
  high: 1.25,
};
export const CLIMATE_FACTOR: Record<Climate, number> = { cool: 0.95, mild: 1.0, hot: 1.15 };

export const GOAL_MIN_ML = 1200;
export const GOAL_MAX_ML = 4500;
export const GOAL_STEP_ML = 50;
/** Used until onboarding sets a goal. */
export const DEFAULT_GOAL_ML = 2000;

export function calcGoalMl(weightKg: number, activity: ActivityLevel, climate: Climate): number {
  const raw = weightKg * 33 * ACTIVITY_FACTOR[activity] * CLIMATE_FACTOR[climate];
  const rounded = Math.round(raw / GOAL_STEP_ML) * GOAL_STEP_ML;
  return Math.min(GOAL_MAX_ML, Math.max(GOAL_MIN_ML, rounded));
}
