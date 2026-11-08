import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useTheme } from '@/theme';

// Minimal inline icons (Material Symbols paths) to avoid an icon-font dependency in Phase 1.
const ICONS = {
  home: 'M12 21.5q-3.3 0-5.65-2.3T4 13.6q0-1.55.6-2.975T6.3 8.1L12 2.5l5.7 5.6q1.1 1.1 1.7 2.525T20 13.6q0 3.3-2.35 5.6T12 21.5Z',
  stats: 'M16 20v-7h4v7h-4Zm-6 0V4h4v16h-4Zm-6 0V9h4v11H4Z',
  widgets:
    'M16.65 13 11 7.35 16.65 1.7l5.65 5.65L16.65 13ZM3 11V3h8v8H3Zm10 10v-8h8v8h-8ZM3 21v-8h8v8H3Z',
  settings:
    'm9.25 22-.4-3.2q-.325-.125-.612-.3-.288-.175-.563-.375L4.7 19.375l-2.75-4.75 2.575-1.95Q4.5 12.5 4.5 12.338v-.675q0-.163.025-.338L1.95 9.375l2.75-4.75 2.975 1.25q.275-.2.575-.375.3-.175.6-.3l.4-3.2h5.5l.4 3.2q.325.125.613.3.287.175.562.375l2.975-1.25 2.75 4.75-2.575 1.95q.025.175.025.338v.674q0 .163-.05.338l2.575 1.95-2.75 4.75-2.95-1.25q-.275.2-.575.375-.3.175-.6.3l-.4 3.2h-5.5ZM12.05 15.5q1.45 0 2.475-1.025Q15.55 13.45 15.55 12q0-1.45-1.025-2.475Q13.5 8.5 12.05 8.5q-1.475 0-2.488 1.025Q8.55 10.55 8.55 12q0 1.45 1.012 2.475Q10.575 15.5 12.05 15.5Z',
} as const;

const icon = (d: string) =>
  function TabIcon({ color }: { color: ColorValue }) {
    return (
      <Svg width={22} height={22} viewBox="0 0 24 24">
        <Path d={d} fill={color} />
      </Svg>
    );
  };

export default function TabsLayout() {
  const { colors, typography } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.onSurfaceVariant,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.outlineVariant },
        tabBarLabelStyle: typography.labelSm,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: icon(ICONS.home) }} />
      <Tabs.Screen name="stats" options={{ title: 'Stats', tabBarIcon: icon(ICONS.stats) }} />
      <Tabs.Screen name="widgets" options={{ title: 'Widgets', tabBarIcon: icon(ICONS.widgets) }} />
      <Tabs.Screen
        name="settings"
        options={{ title: 'Settings', tabBarIcon: icon(ICONS.settings) }}
      />
    </Tabs>
  );
}
