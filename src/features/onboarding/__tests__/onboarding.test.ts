import { describe, expect, it } from '@jest/globals';

import { createTestDb } from '@/db/__tests__/test-db';
import { getGoalMl, getSetting, getToday } from '@/db/queries';

import {
  completeOnboarding,
  DEFAULT_DRAFT,
  finalGoalMl,
  isOnboardingComplete,
  suggestedGoalMl,
  to12h,
} from '../onboarding';

describe('onboarding', () => {
  it('starts incomplete', () => {
    expect(isOnboardingComplete(createTestDb().db)).toBe(false);
  });

  it('suggests the formula goal for defaults (70 kg, moderate, mild)', () => {
    expect(suggestedGoalMl(DEFAULT_DRAFT)).toBe(2550);
  });

  it('uses an edited goal but keeps it within 1,200–4,500 ml', () => {
    expect(finalGoalMl({ ...DEFAULT_DRAFT, goalOverrideMl: 3000 })).toBe(3000);
    expect(finalGoalMl({ ...DEFAULT_DRAFT, goalOverrideMl: 500 })).toBe(1200);
    expect(finalGoalMl({ ...DEFAULT_DRAFT, goalOverrideMl: 9000 })).toBe(4500);
  });

  it('saves the profile, sets the goal for today and marks complete', () => {
    const { db } = createTestDb();
    const now = new Date(2026, 10, 8, 9).getTime();
    const goal = completeOnboarding(
      db,
      { ...DEFAULT_DRAFT, volumeUnit: 'oz', wakeTime: '06:30' },
      now,
    );
    expect(goal).toBe(2550);
    expect(isOnboardingComplete(db)).toBe(true);
    expect(getGoalMl(db)).toBe(2550);
    expect(getToday(db, now).goalMl).toBe(2550);
    expect(getSetting(db, 'volume_unit')).toBe('oz');
    expect(getSetting(db, 'wake_time')).toBe('06:30');
  });

  it('formats 12-hour times', () => {
    expect(to12h('07:00')).toEqual({ time: '07:00', period: 'AM' });
    expect(to12h('23:00')).toEqual({ time: '11:00', period: 'PM' });
    expect(to12h('00:15')).toEqual({ time: '12:15', period: 'AM' });
    expect(to12h('12:00')).toEqual({ time: '12:00', period: 'PM' });
  });
});
