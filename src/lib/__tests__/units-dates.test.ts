import { describe, expect, it } from '@jest/globals';
import { addDays, dateRange, nextMidnight, toDateKey } from '../dates';
import { formatVolume, kgToLb, lbToKg, mlToOz, ozToMl } from '../units';

describe('units', () => {
  it('converts ml ↔ US fl oz', () => {
    expect(mlToOz(29.5735)).toBeCloseTo(1, 6);
    expect(ozToMl(8)).toBeCloseTo(236.588, 3);
    expect(ozToMl(mlToOz(250))).toBeCloseTo(250, 9);
  });

  it('formats for display', () => {
    expect(formatVolume(1250, 'ml')).toBe('1,250 ml');
    expect(formatVolume(250, 'oz')).toBe('8.5 oz');
  });

  it('converts kg ↔ lb', () => {
    expect(lbToKg(154)).toBeCloseTo(69.85, 2);
    expect(kgToLb(lbToKg(180))).toBeCloseTo(180, 9);
  });
});

describe('dates (TZ=America/New_York)', () => {
  it('uses the local calendar day, not UTC', () => {
    // 23:30 local on 1 Mar = 04:30 UTC on 2 Mar
    expect(toDateKey(new Date(2026, 2, 1, 23, 30))).toBe('2026-03-01');
    expect(toDateKey(new Date(2026, 2, 2, 0, 0))).toBe('2026-03-02');
  });

  it('adds calendar days across DST changes and month/year ends', () => {
    expect(addDays('2026-03-07', 1)).toBe('2026-03-08'); // spring forward (23h day)
    expect(addDays('2026-03-08', 1)).toBe('2026-03-09');
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01'); // fall back (25h day)
    expect(addDays('2026-11-01', 1)).toBe('2026-11-02');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2028-03-01', -1)).toBe('2028-02-29');
  });

  it('builds inclusive ranges', () => {
    expect(dateRange('2026-02-27', '2026-03-02')).toEqual([
      '2026-02-27',
      '2026-02-28',
      '2026-03-01',
      '2026-03-02',
    ]);
    expect(dateRange('2026-03-02', '2026-03-01')).toEqual([]);
  });

  it('finds the next local midnight, even on a 25-hour day', () => {
    const noon = new Date(2026, 10, 1, 12).getTime();
    expect(nextMidnight(noon)).toBe(new Date(2026, 10, 2).getTime());
  });
});
