import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, {
  FadeInUp,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';

import type { IconName } from '@/components/choice-card';
import type { Drink, Log } from '@/db';
import { formatVolume, type VolumeUnit } from '@/lib/units';
import { useTheme } from '@/theme';

type Props = { log: Log; drink?: Drink; unit: VolumeUnit; onDelete: (id: string) => void };

/** Hidden until the row is actually dragged, so it never shows through a fading row. */
function DeleteAction({
  progress,
  label,
  bg,
  fg,
}: {
  progress: SharedValue<number>;
  label: string;
  bg: string;
  fg: string;
}) {
  const style = useAnimatedStyle(() => ({ opacity: progress.value > 0.01 ? 1 : 0 }));
  return (
    <Animated.View style={[styles.delete, { backgroundColor: bg }, style]}>
      <MaterialCommunityIcons name="trash-can-outline" size={22} color={fg} />
      <Text style={{ color: fg }}>{label}</Text>
    </Animated.View>
  );
}

const time = (ts: number) => {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

/** Today's log entry. Swipe left to delete; enters from the top, collapses on delete. */
export function LogRow({ log, drink, unit, onDelete }: Props) {
  const { colors, typography } = useTheme();
  const name = drink?.name ?? 'Drink';
  const amount = formatVolume(log.amountMl, unit);

  return (
    <Animated.View
      entering={FadeInUp.duration(250)}
      exiting={FadeOut.duration(150)}
      layout={LinearTransition}
    >
      <ReanimatedSwipeable
        friction={2}
        rightThreshold={60}
        overshootRight={false}
        onSwipeableOpen={() => onDelete(log.id)}
        renderRightActions={(progress) => (
          <DeleteAction progress={progress} label="Delete" bg={colors.error} fg={colors.onError} />
        )}
      >
        <View
          accessible
          accessibilityLabel={`${name}, ${amount} at ${time(log.ts)}`}
          accessibilityHint="Swipe left to delete"
          accessibilityActions={[{ name: 'delete', label: 'Delete' }]}
          onAccessibilityAction={(e) => e.nativeEvent.actionName === 'delete' && onDelete(log.id)}
          style={[styles.row, { backgroundColor: colors.surfaceContainerLowest }]}
        >
          <View style={[styles.icon, { backgroundColor: colors.surfaceContainerLow }]}>
            <MaterialCommunityIcons
              name={(drink?.icon ?? 'water') as IconName}
              size={22}
              color={colors.primary}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[typography.labelLg, { color: colors.onSurface }]}>{name}</Text>
            <Text style={[typography.labelSm, { color: colors.outline }]}>{time(log.ts)}</Text>
          </View>
          <Text style={[typography.headlineSm, { color: colors.primary }]}>{amount}</Text>
          <MaterialCommunityIcons name="check-circle" size={18} color={colors.secondary} />
        </View>
      </ReanimatedSwipeable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 24,
    minHeight: 64,
  },
  icon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  delete: {
    width: 96,
    borderRadius: 24,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
});
