import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme';

export function ScreenPlaceholder({ title }: { title: string }) {
  const { colors, typography, spacing } = useTheme();
  return (
    <View style={[styles.root, { backgroundColor: colors.background, padding: spacing.margin }]}>
      <Text style={[typography.headlineLg, { color: colors.onSurface }]}>{title}</Text>
      <Text style={[typography.bodyMd, { color: colors.onSurfaceVariant, marginTop: spacing.sm }]}>
        Placeholder (Phase 1)
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
