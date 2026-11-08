import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import type { IconName } from '@/components/choice-card';
import { formatVolume, type VolumeUnit } from '@/lib/units';
import { useTheme } from '@/theme';

const LABELS: Record<number, { label: string; icon: IconName }> = {
  150: { label: 'Sip / Glass', icon: 'water-outline' },
  250: { label: 'Standard cup', icon: 'cup-outline' },
  500: { label: 'Pebble flask', icon: 'bottle-tonic-outline' },
};

type Props = { amountMl: number; unit: VolumeUnit; onAdd: (ml: number) => void };

export function QuickAddButton({ amountMl, unit, onAdd }: Props) {
  const { colors, typography } = useTheme();
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const meta = LABELS[amountMl] ?? { label: 'Cup', icon: 'cup-outline' as IconName };
  const text = `+${formatVolume(amountMl, unit)}`;

  return (
    <Animated.View style={[styles.flex, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Add ${formatVolume(amountMl, unit)}`}
        onPressIn={() => scale.set(withSpring(0.95, { damping: 15, stiffness: 400 }))}
        onPressOut={() => scale.set(withSpring(1, { damping: 12, stiffness: 300 }))}
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onAdd(amountMl);
        }}
        style={[styles.card, { backgroundColor: colors.surfaceContainerLowest }]}
      >
        <View style={[styles.icon, { backgroundColor: colors.surfaceContainer }]}>
          <MaterialCommunityIcons name={meta.icon} size={20} color={colors.primary} />
        </View>
        <Text style={[typography.headlineSm, { color: colors.onSurface }]}>{text}</Text>
        <Text style={[typography.labelSm, { color: colors.outline }]}>{meta.label}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: {
    borderRadius: 32,
    paddingVertical: 14,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 4,
  },
  icon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
