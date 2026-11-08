import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme';

type Props = {
  value: string;
  unit: string;
  onDecrement: () => void;
  onIncrement: () => void;
  label: string;
};

/** Big number with − / + buttons (48dp targets). Holding a button repeats. */
export function Stepper({ value, unit, onDecrement, onIncrement, label }: Props) {
  const { colors, typography } = useTheme();
  const btn = (icon: 'minus' | 'plus', fn: () => void, a11y: string) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11y}
      onPress={fn}
      onLongPress={fn}
      delayLongPress={250}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: colors.surfaceContainer, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <MaterialCommunityIcons name={icon} size={24} color={colors.primary} />
    </Pressable>
  );
  return (
    <View style={styles.row} accessibilityLabel={`${label}: ${value} ${unit}`}>
      {btn('minus', onDecrement, `Decrease ${label}`)}
      <View style={styles.value}>
        <Text
          style={[
            typography.displayMdMobile,
            { color: colors.onSurface, fontSize: 44, lineHeight: 52 },
          ]}
        >
          {value}
        </Text>
        <Text style={[typography.headlineSm, { color: colors.onSurfaceVariant }]}> {unit}</Text>
      </View>
      {btn('plus', onIncrement, `Increase ${label}`)}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  value: { flexDirection: 'row', alignItems: 'baseline' },
  btn: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
});
