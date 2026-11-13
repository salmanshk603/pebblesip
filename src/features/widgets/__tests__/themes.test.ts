import { describe, expect, it } from '@jest/globals';

import { resolveTheme, WIDGET_THEMES } from '../themes';

describe('resolveTheme', () => {
  it('free users only get Pastel Aqua and no accent', () => {
    expect(resolveTheme('night', '#E07A6E', false)).toEqual(WIDGET_THEMES.aqua);
    expect(resolveTheme('aqua', '#E07A6E', false)).toEqual(WIDGET_THEMES.aqua);
  });

  it('Premium users get any theme plus the accent', () => {
    expect(resolveTheme('night', null, true)).toEqual(WIDGET_THEMES.night);
    const t = resolveTheme('sakura', '#6AA8D6', true);
    expect(t.bgFrom).toBe(WIDGET_THEMES.sakura.bgFrom);
    expect(t.fill).toBe('#6AA8D6');
    expect(t.button).toBe('#6AA8D6');
  });
});
