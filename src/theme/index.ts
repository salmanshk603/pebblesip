import { useColorScheme } from 'react-native';

import { dark, light, type ColorScheme } from './colors';
import { radius, spacing } from './spacing';
import { typography } from './typography';

export * from './colors';
export * from './spacing';
export * from './typography';

export type Theme = {
  dark: boolean;
  colors: ColorScheme;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
};

export function useTheme(): Theme {
  const isDark = useColorScheme() === 'dark';
  return { dark: isDark, colors: isDark ? dark : light, spacing, radius, typography };
}
