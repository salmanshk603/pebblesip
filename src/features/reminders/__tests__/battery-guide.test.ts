import { describe, expect, it } from '@jest/globals';

import { guideFor } from '../battery-guide';

describe('guideFor', () => {
  it('matches brands case-insensitively', () => {
    expect(guideFor('Xiaomi').id).toBe('xiaomi');
    expect(guideFor('samsung').id).toBe('samsung');
    expect(guideFor('OnePlus').id).toBe('oppo');
    expect(guideFor('vivo').id).toBe('vivo');
  });
  it('falls back to generic steps', () => {
    expect(guideFor('Google').id).toBe('other');
    expect(guideFor(null).id).toBe('other');
  });
});
