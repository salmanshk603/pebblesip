import type { ColorProp } from 'react-native-android-widget';

import { brand } from '@/theme/colors';

/** Home-screen widget themes (PRD §5.6). Only Pastel Aqua is free. */
export interface WidgetTheme {
  id: WidgetThemeId;
  name: string;
  premium: boolean;
  bgFrom: ColorProp;
  bgTo: ColorProp;
  text: ColorProp;
  subtext: ColorProp;
  track: ColorProp;
  fill: ColorProp;
  button: ColorProp;
  buttonText: ColorProp;
  pipFrom: ColorProp;
  pipTo: ColorProp;
}

export const WIDGET_THEME_IDS = [
  'aqua',
  'zen',
  'glass',
  'matcha',
  'night',
  'ocean',
  'sakura',
] as const;
export type WidgetThemeId = (typeof WIDGET_THEME_IDS)[number];

const PIP = {
  pipFrom: brand.pipGradientStart as ColorProp,
  pipTo: brand.pipGradientEnd as ColorProp,
};

export const WIDGET_THEMES: Record<WidgetThemeId, WidgetTheme> = {
  aqua: {
    id: 'aqua',
    name: 'Pastel Aqua',
    premium: false,
    bgFrom: '#DDF4EF',
    bgTo: '#A9E3D8',
    text: '#004A43',
    subtext: '#256E59',
    track: '#FFFFFF99',
    fill: '#4FBFB1',
    button: '#006A61',
    buttonText: '#FFFFFF',
    ...PIP,
  },
  zen: {
    id: 'zen',
    name: 'Zen Stone',
    premium: true,
    bgFrom: '#EEE8DF',
    bgTo: '#D8CFC2',
    text: '#4A443C',
    subtext: '#7A7166',
    track: '#FFFFFF99',
    fill: '#8C8378',
    button: '#5E574E',
    buttonText: '#FFFFFF',
    pipFrom: '#D9D2C7',
    pipTo: '#B5AC9F',
  },
  glass: {
    id: 'glass',
    name: 'Glass',
    premium: true,
    bgFrom: '#FFFFFFB3',
    bgTo: '#FFFFFF80',
    text: '#1E1B15',
    subtext: '#3D4947',
    track: '#00000014',
    fill: '#4FBFB1',
    button: '#FFFFFFE6',
    buttonText: '#006A61',
    ...PIP,
  },
  matcha: {
    id: 'matcha',
    name: 'Matcha',
    premium: true,
    bgFrom: '#DCEBD3',
    bgTo: '#A9C99A',
    text: '#22401A',
    subtext: '#3E6233',
    track: '#FFFFFF99',
    fill: '#4E7A3F',
    button: '#2F5524',
    buttonText: '#FFFFFF',
    pipFrom: '#9CC48A',
    pipTo: '#6E9C5C',
  },
  night: {
    id: 'night',
    name: 'Night',
    premium: true,
    bgFrom: '#000000',
    bgTo: '#0E1A18',
    text: '#FFFFFF',
    subtext: '#7FD1C7',
    track: '#FFFFFF26',
    fill: '#4FBFB1',
    button: '#1F3A36',
    buttonText: '#7FD1C7',
    ...PIP,
  },
  ocean: {
    id: 'ocean',
    name: 'Ocean',
    premium: true,
    bgFrom: '#1D3F63',
    bgTo: '#2D6A8F',
    text: '#FFFFFF',
    subtext: '#B9E4F2',
    track: '#FFFFFF33',
    fill: '#5FD3E0',
    button: '#0F2742',
    buttonText: '#FFFFFF',
    ...PIP,
  },
  sakura: {
    id: 'sakura',
    name: 'Sakura',
    premium: true,
    bgFrom: '#FBE3E6',
    bgTo: '#F2B9C1',
    text: '#5A2230',
    subtext: '#8A4253',
    track: '#FFFFFF99',
    fill: '#D9707F',
    button: '#A4374B',
    buttonText: '#FFFFFF',
    pipFrom: '#F6BCC4',
    pipTo: '#E592A0',
  },
};

/** Premium custom accent swatches (progress fill + button). */
export const ACCENT_COLORS = [
  '#9A86C4',
  '#E07A6E',
  '#D9B65C',
  '#86B07A',
  '#8E9AA6',
  '#6AA8D6',
] as const;

/** The theme actually drawn: premium themes and accents fall back to free without Premium. */
export function resolveTheme(
  id: WidgetThemeId,
  accent: string | null,
  premium: boolean,
): WidgetTheme {
  const base = WIDGET_THEMES[id];
  const theme = base.premium && !premium ? WIDGET_THEMES.aqua : base;
  return premium && accent
    ? { ...theme, fill: accent as ColorProp, button: accent as ColorProp, buttonText: '#FFFFFF' }
    : theme;
}

/** Static Pip (happy) as an SVG string; widgets cannot animate. */
export function pipSvg(t: Pick<WidgetTheme, 'pipFrom' | 'pipTo'>): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
<defs><linearGradient id="b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${t.pipFrom}"/><stop offset="1" stop-color="${t.pipTo}"/></linearGradient></defs>
<path d="M22 45 C20 25, 40 14, 58 15 C76 16, 85 28, 83 52 C81 74, 68 85, 48 85 C28 85, 24 65, 22 45 Z" fill="url(#b)"/>
<ellipse cx="40" cy="28" rx="12" ry="6" fill="#FFFFFF" opacity="0.55" transform="rotate(-20 40 28)"/>
<circle cx="42" cy="48" r="3.5" fill="${brand.pipEye}"/><circle cx="43.2" cy="46.8" r="1.2" fill="#FFFFFF"/>
<circle cx="64" cy="48" r="3.5" fill="${brand.pipEye}"/><circle cx="65.2" cy="46.8" r="1.2" fill="#FFFFFF"/>
<ellipse cx="36" cy="56" rx="4.5" ry="2.5" fill="${brand.pipBlush}" opacity="0.65"/>
<ellipse cx="70" cy="56" rx="4.5" ry="2.5" fill="${brand.pipBlush}" opacity="0.65"/>
<path d="M 49 54 Q 53 58 57 54" stroke="${brand.pipEye}" stroke-width="2" fill="none" stroke-linecap="round"/>
</svg>`;
}
