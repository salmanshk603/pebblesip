/** Per-brand steps so reminders aren't killed by aggressive battery savers. */
export interface BrandGuide {
  id: string;
  name: string;
  /** Lower-case substrings matched against Device.manufacturer / brand. */
  match: string[];
  steps: string[];
}

export const BRAND_GUIDES: BrandGuide[] = [
  {
    id: 'xiaomi',
    name: 'Xiaomi / Redmi / POCO',
    match: ['xiaomi', 'redmi', 'poco'],
    steps: [
      'Settings → Apps → Manage apps → Pebblesip.',
      'Turn on Autostart.',
      'Battery saver → choose "No restrictions".',
      'Open Recent apps, long-press Pebblesip and tap the lock icon.',
    ],
  },
  {
    id: 'samsung',
    name: 'Samsung',
    match: ['samsung'],
    steps: [
      'Settings → Apps → Pebblesip → Battery → choose "Unrestricted".',
      'Settings → Battery → Background usage limits: make sure Pebblesip is not in "Sleeping apps" or "Deep sleeping apps".',
    ],
  },
  {
    id: 'oppo',
    name: 'Oppo / Realme / OnePlus',
    match: ['oppo', 'realme', 'oneplus'],
    steps: [
      'Settings → Apps → App management → Pebblesip.',
      'Battery usage → turn on "Allow background activity" (and "Allow auto launch" if shown).',
      'Open Recent apps and lock Pebblesip.',
    ],
  },
  {
    id: 'vivo',
    name: 'Vivo / iQOO',
    match: ['vivo', 'iqoo'],
    steps: [
      'Settings → Battery → Background power consumption management → Pebblesip → "Allow".',
      'Settings → Apps → Autostart → turn on Pebblesip.',
    ],
  },
  {
    id: 'other',
    name: 'Other Android phones',
    match: [],
    steps: [
      'Settings → Apps → Pebblesip → Battery → choose "Unrestricted" or "Not optimised".',
      'Make sure notifications are allowed for Pebblesip.',
    ],
  },
];

export function guideFor(manufacturer: string | null | undefined): BrandGuide {
  const m = (manufacturer ?? '').toLowerCase();
  return (
    BRAND_GUIDES.find((g) => g.match.some((k) => m.includes(k))) ??
    BRAND_GUIDES[BRAND_GUIDES.length - 1]!
  );
}
