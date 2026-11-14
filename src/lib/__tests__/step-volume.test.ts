import { describe, expect, it } from '@jest/globals';

import { mlToOz, stepVolume } from '../units';

const oz = (ml: number) => Math.round(mlToOz(ml) * 100) / 100;

describe('stepVolume', () => {
  it('steps 50 ml in ml mode', () => {
    expect(stepVolume(250, 1, 'ml')).toBe(300);
    expect(stepVolume(250, -1, 'ml')).toBe(200);
  });
  it('steps whole ounces in oz mode', () => {
    expect(oz(stepVolume(250, 1, 'oz'))).toBe(9); // 8.45 oz → 9 oz
    expect(oz(stepVolume(stepVolume(250, 1, 'oz'), 1, 'oz'))).toBe(10);
    expect(oz(stepVolume(250, -1, 'oz'))).toBe(7);
  });
});
