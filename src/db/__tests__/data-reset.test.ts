import { describe, expect, it } from '@jest/globals';

import {
  addLog,
  getCups,
  getSetting,
  getToday,
  resetDay,
  setCupAmounts,
  setSetting,
  wipeAllData,
} from '../queries';
import { seed } from '../seed';
import { createTestDb } from './test-db';

const at = (d: number, h = 12) => new Date(2026, 10, d, h).getTime();

describe('resetDay', () => {
  it('removes only that day', () => {
    const { db } = createTestDb();
    addLog(db, { amountMl: 500, ts: at(12) });
    addLog(db, { amountMl: 250, ts: at(13) });
    addLog(db, { amountMl: 250, ts: at(13, 15) });
    expect(resetDay(db, at(13))).toBe(2);
    expect(getToday(db, at(13)).totalMl).toBe(0);
    expect(getToday(db, at(12)).totalMl).toBe(500);
  });
});

describe('wipeAllData', () => {
  it('clears logs and settings; seed restores defaults', () => {
    const { db } = createTestDb();
    setSetting(db, 'onboarding_complete', '1');
    addLog(db, { amountMl: 500, ts: at(13) });
    setCupAmounts(db, [200, 300, 600]);
    wipeAllData(db);
    seed(db);
    expect(getSetting(db, 'onboarding_complete')).toBeUndefined();
    expect(getToday(db, at(13)).totalMl).toBe(0);
    expect(getCups(db).map((c) => c.amountMl)).toEqual([150, 250, 500]);
  });
});

describe('setCupAmounts', () => {
  it('updates presets in order', () => {
    const { db } = createTestDb();
    setCupAmounts(db, [100, 330, 750]);
    expect(getCups(db).map((c) => c.amountMl)).toEqual([100, 330, 750]);
  });
});
