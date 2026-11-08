import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme';

export type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

type Props = {
  label: string;
  sublabel?: string;
  icon: IconName;
  selected: boolean;
  onPress: () => void;
  compact?: boolean;
};

export function ChoiceCard({ label, sublabel, icon, selected, onPress, compact }: Props) {
  const { colors, typography, spacing } = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={sublabel ? `${label}, ${sublabel}` : label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        compact ? styles.compact : null,
        {
          backgroundColor: selected ? colors.secondaryContainer : colors.surfaceContainerLowest,
          borderColor: selected ? colors.primaryContainer : colors.outlineVariant,
          padding: compact ? spacing.sm : spacing.md,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View
        style={[
          compact ? styles.iconSmall : styles.icon,
          { backgroundColor: selected ? colors.primary : colors.surfaceContainer },
        ]}
      >
        <MaterialCommunityIcons
          name={icon}
          size={compact ? 16 : 22}
          color={selected ? colors.onPrimary : colors.primary}
        />
      </View>
      <Text
        style={[
          typography.labelLg,
          { color: selected ? colors.onSecondaryContainer : colors.onSurface },
        ]}
      >
        {label}
      </Text>
      {sublabel ? (
        <Text style={[typography.labelSm, { color: colors.onSurfaceVariant }]}>{sublabel}</Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, minHeight: 48, borderRadius: 16, borderWidth: 2, alignItems: 'center', gap: 6 },
  compact: { flexDirection: 'row', justifyContent: 'center' },
  icon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  iconSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
