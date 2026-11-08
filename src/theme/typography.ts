import type { TextStyle } from 'react-native';

// Font keys match the names registered with useFonts in app/_layout.tsx.
export const fonts = {
  headline: {
    400: 'NunitoSans_400Regular',
    600: 'NunitoSans_600SemiBold',
    700: 'NunitoSans_700Bold',
    800: 'NunitoSans_800ExtraBold',
  },
  body: {
    400: 'Inter_400Regular',
    500: 'Inter_500Medium',
    600: 'Inter_600SemiBold',
    700: 'Inter_700Bold',
  },
} as const;

const t = (
  fontFamily: string,
  fontSize: number,
  lineHeight: number,
  letterSpacingEm = 0,
): TextStyle => ({
  fontFamily,
  fontSize,
  lineHeight,
  letterSpacing: letterSpacingEm * fontSize,
});

export const typography = {
  displayLg: t(fonts.headline[800], 56, 64, -0.02),
  displayLgMobile: t(fonts.headline[800], 44, 52, -0.02),
  displayMd: t(fonts.headline[700], 40, 48, -0.01),
  displayMdMobile: t(fonts.headline[700], 32, 40, -0.01),
  headlineLg: t(fonts.headline[700], 28, 36),
  headlineMd: t(fonts.headline[600], 22, 28),
  headlineSm: t(fonts.headline[600], 18, 24),
  bodyLg: t(fonts.body[400], 16, 24),
  bodyMd: t(fonts.body[400], 14, 20),
  bodySm: t(fonts.body[400], 12, 16),
  labelLg: t(fonts.body[600], 14, 20, 0.01),
  labelMd: t(fonts.body[600], 12, 16, 0.02),
  labelSm: t(fonts.body[500], 11, 14, 0.03),
} as const;

export type TypographyVariant = keyof typeof typography;
