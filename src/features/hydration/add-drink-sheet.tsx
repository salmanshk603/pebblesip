import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import type { IconName } from '@/components/choice-card';
import { Stepper } from '@/components/stepper';
import { WATER_ID, type Cup, type Drink } from '@/db';
import { formatVolume, mlToOz, type VolumeUnit } from '@/lib/units';
import { useTheme } from '@/theme';

const MIN_ML = 50;
const MAX_ML = 2000;
const STEP_ML = 50;

type Props = {
  visible: boolean;
  onClose: () => void;
  onAdd: (amountMl: number, drinkId: string) => void;
  drinks: Drink[];
  cups: Cup[];
  unit: VolumeUnit;
  goalMl: number;
  premium: boolean;
};

/** Remount (change `key`) on each open to reset the selection. */
export function AddDrinkSheet({
  visible,
  onClose,
  onAdd,
  drinks,
  cups,
  unit,
  goalMl,
  premium,
}: Props) {
  const { colors, typography, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const [drinkId, setDrinkId] = useState(WATER_ID);
  const [amount, setAmount] = useState(250);
  const [lockedHint, setLockedHint] = useState(false);

  const clamp = (v: number) => Math.min(MAX_ML, Math.max(MIN_ML, v));
  const shown = unit === 'oz' ? String(Math.round(mlToOz(amount) * 10) / 10) : String(amount);
  const pct = Math.round((amount / goalMl) * 100);
  const label = [
    typography.labelMd,
    { color: colors.onSurfaceVariant, textTransform: 'uppercase' as const },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
      <View
        style={[
          styles.sheet,
          {
            backgroundColor: colors.surfaceContainerLowest,
            padding: spacing.margin,
            paddingBottom: insets.bottom + spacing.md,
            gap: spacing.md,
          },
        ]}
      >
        <View style={[styles.handle, { backgroundColor: colors.outlineVariant }]} />
        <View style={styles.rowBetween}>
          <View>
            <Text
              accessibilityRole="header"
              style={[typography.headlineMd, { color: colors.onSurface }]}
            >
              Add a drink
            </Text>
            <Text style={[typography.bodySm, { color: colors.onSurfaceVariant }]}>
              Mindful hydration, sip by sip
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            onPress={onClose}
            style={[styles.close, { backgroundColor: colors.surfaceContainer }]}
          >
            <MaterialCommunityIcons name="close" size={20} color={colors.onSurface} />
          </Pressable>
        </View>

        <Text style={label}>Select beverage</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
        >
          {drinks.map((d) => {
            const locked = d.premium && !premium;
            const on = d.id === drinkId;
            return (
              <Pressable
                key={d.id}
                accessibilityRole="radio"
                accessibilityState={{ selected: on, disabled: locked }}
                accessibilityLabel={locked ? `${d.name}, Premium` : d.name}
                onPress={() => (locked ? setLockedHint(true) : setDrinkId(d.id))}
                style={[
                  styles.chip,
                  {
                    backgroundColor: on ? colors.secondaryContainer : colors.surfaceContainerLow,
                    borderColor: on ? colors.primaryContainer : colors.outlineVariant,
                    opacity: locked ? 0.6 : 1,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={d.icon as IconName}
                  size={18}
                  color={colors.primary}
                />
                <Text style={[typography.labelLg, { color: colors.onSurface }]}>{d.name}</Text>
                {locked ? (
                  <MaterialCommunityIcons name="lock-outline" size={14} color={colors.outline} />
                ) : null}
              </Pressable>
            );
          })}
        </ScrollView>
        {lockedHint ? (
          <Text style={[typography.bodySm, { color: colors.onSurfaceVariant }]}>
            Other drinks come with Pebblesip Premium.
          </Text>
        ) : null}

        <View
          style={[
            styles.amount,
            { backgroundColor: colors.surfaceContainerLow, padding: spacing.md },
          ]}
        >
          <Stepper
            label="amount"
            value={shown}
            unit={unit}
            onDecrement={() => setAmount((a) => clamp(a - STEP_ML))}
            onIncrement={() => setAmount((a) => clamp(a + STEP_ML))}
          />
          <Text
            style={[typography.labelMd, { color: colors.onSurfaceVariant, textAlign: 'center' }]}
          >
            {pct}% of your daily goal
          </Text>
        </View>

        <Text style={label}>Quick presets</Text>
        <View style={styles.row}>
          {cups.map((c) => {
            const on = c.amountMl === amount;
            return (
              <Pressable
                key={c.id}
                accessibilityRole="button"
                accessibilityLabel={`Set ${formatVolume(c.amountMl, unit)}`}
                onPress={() => setAmount(c.amountMl)}
                style={[
                  styles.preset,
                  {
                    backgroundColor: on ? colors.secondaryContainer : colors.surfaceContainerLow,
                    borderColor: on ? colors.primaryContainer : 'transparent',
                  },
                ]}
              >
                <Text style={[typography.headlineSm, { color: colors.onSurface }]}>
                  {formatVolume(c.amountMl, unit)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Button
          label={`Add ${formatVolume(amount, unit)}`}
          onPress={() => onAdd(amount, drinkId)}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: { borderTopLeftRadius: 32, borderTopRightRadius: 32 },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  close: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: 24,
    borderWidth: 2,
  },
  amount: { borderRadius: 24, gap: 8 },
  row: { flexDirection: 'row', gap: 8 },
  preset: {
    flex: 1,
    minHeight: 56,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
