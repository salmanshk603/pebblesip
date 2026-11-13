import { describe, expect, it } from '@jest/globals';

import { createTestDb } from '@/db/__tests__/test-db';

import { getThemeTrial, startThemeTrial, TRIAL_MS } from '../widget-data';

describe('theme trial (rewarded ad)', () => {
  it('unlocks one theme for 24 h, then relocks', () => {
    const { db } = createTestDb();
    const now = Date.UTC(2026, 10, 13, 12);
    expect(getThemeTrial(db, now)).toBeNull();
    startThemeTrial(db, 'night', now);
    expect(getThemeTrial(db, now + TRIAL_MS - 1)?.theme).toBe('night');
    expect(getThemeTrial(db, now + TRIAL_MS)).toBeNull();
  });
});
