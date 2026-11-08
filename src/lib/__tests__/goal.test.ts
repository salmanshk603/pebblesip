import { describe, expect, it } from '@jest/globals';
import { calcGoalMl, GOAL_MAX_ML, GOAL_MIN_ML } from '../goal';

describe('calcGoalMl (prd.md §5.1)', () => {
  it('applies weight × 33 × factors, rounded to 50 ml', () => {
    expect(calcGoalMl(70, 'low', 'mild')).toBe(2300); // 2310 → 2300
    expect(calcGoalMl(70, 'moderate', 'hot')).toBe(2900); // 2922.15 → 2900
    expect(calcGoalMl(60, 'high', 'cool')).toBe(2350); // 2351.25 → 2350
  });

  it('matches the testing.md example: 70 kg, moderate, mild → 2,550 ml', () => {
    expect(calcGoalMl(70, 'moderate', 'mild')).toBe(2550); // 2541 → 2550
  });

  it('rounds half-steps to the nearest 50', () => {
    expect(calcGoalMl(50, 'low', 'mild')).toBe(1650); // 1650 exact
    expect(calcGoalMl(51, 'low', 'mild')).toBe(1700); // 1683 → 1700
  });

  it('clamps to 1,200–4,500 ml', () => {
    expect(calcGoalMl(20, 'low', 'cool')).toBe(GOAL_MIN_ML);
    expect(calcGoalMl(200, 'high', 'hot')).toBe(GOAL_MAX_ML);
  });
});
