import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Pip } from '@/components/pip';
import { AddDrinkSheet } from '@/features/hydration/add-drink-sheet';
import { AnimatedPip } from '@/features/hydration/animated-pip';
import { CelebrationBurst } from '@/features/hydration/celebration-burst';
import { LogRow } from '@/features/hydration/log-row';
import { QuickAddButton } from '@/features/hydration/quick-add-button';
import { UndoSnackbar } from '@/features/hydration/undo-snackbar';
import { useCountUp } from '@/features/hydration/use-count-up';
import { useHydration } from '@/features/hydration/use-hydration';
import { WaterReservoir } from '@/features/hydration/water-reservoir';
import { usePremium } from '@/features/premium/use-premium';
import { fromDateKey } from '@/lib/dates';
import { formatVolume, mlToOz } from '@/lib/units';
import { useTheme } from '@/theme';

const RESERVOIR = 240;

function greeting(h: number) {
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function pipMessage(percent: number) {
  if (percent >= 100) return 'Goal reached! Pip is shining.';
  if (percent >= 75) return 'Almost there. Pip is feeling great!';
  if (percent >= 25) return 'Taking it one gentle sip at a time.';
  return 'Pip is a little sleepy. A few sips?';
}

export default function HomeScreen() {
  const { colors, typography, spacing } = useTheme();
  const premium = usePremium();
  const { today, streak, unit, cups, drinks, add, undo, remove } = useHydration();
  const [focused, setFocused] = useState(true);
  const [sheet, setSheet] = useState(false);
  const [sheetKey, setSheetKey] = useState(0);
  const [snack, setSnack] = useState<{ id: number; message: string } | null>(null);
  const [sipKey, setSipKey] = useState(0);
  const [burstKey, setBurstKey] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );

  const drinkById = useMemo(() => new Map(drinks.map((d) => [d.id, d])), [drinks]);
  const shownTotal = useCountUp(today.totalMl);
  const fmtNum = (ml: number) =>
    unit === 'oz' ? String(Math.round(mlToOz(ml) * 10) / 10) : ml.toLocaleString('en-US');

  const onAdd = (ml: number, drinkId?: string) => {
    const { celebrate } = add(ml, drinkId);
    setSipKey((k) => k + 1);
    const name = drinkId ? (drinkById.get(drinkId)?.name ?? 'Drink') : 'Water';
    setSnack({ id: Date.now(), message: `${name} · ${formatVolume(ml, unit)} added` });
    if (celebrate) {
      setBurstKey((k) => k + 1);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const now = new Date();
  const dateLabel = fromDateKey(today.date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });
  const remaining = today.goalMl - today.totalMl;

  return (
    <SafeAreaView edges={['top']} style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{
          padding: spacing.margin,
          paddingBottom: 96,
          gap: spacing.lg,
        }}
      >
        {/* Header */}
        <View style={styles.rowBetween}>
          <View style={styles.row}>
            <View style={[styles.avatar, { backgroundColor: colors.surfaceContainer }]}>
              <Pip size={34} />
            </View>
            <View>
              <Text style={[typography.headlineSm, { color: colors.onSurface }]}>Pebblesip</Text>
              <Text style={[typography.labelSm, { color: colors.onSurfaceVariant }]}>
                {greeting(now.getHours())} · Today, {dateLabel}
              </Text>
            </View>
          </View>
          <View
            accessibilityLabel={`${streak} day streak`}
            style={[styles.streak, { backgroundColor: colors.surfaceContainerLow }]}
          >
            <MaterialCommunityIcons name="fire" size={16} color={colors.primaryContainer} />
            <Text style={[typography.labelMd, { color: colors.onSurface }]}>{streak}</Text>
          </View>
        </View>

        {/* Reservoir card */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surfaceContainerLowest, padding: spacing.lg },
          ]}
        >
          <WaterReservoir size={RESERVOIR} fill={today.totalMl / today.goalMl} active={focused}>
            <AnimatedPip size={110} active={focused} sipKey={sipKey} />
            <CelebrationBurst playKey={burstKey} radius={RESERVOIR / 2 + 20} />
          </WaterReservoir>
          <View
            accessible
            accessibilityLabel={`${formatVolume(today.totalMl, unit)} of ${formatVolume(today.goalMl, unit)}, ${today.percent} percent`}
            style={[styles.total, { marginTop: spacing.md }]}
          >
            <Text style={[typography.displayMdMobile, { color: colors.onSurface }]}>
              {fmtNum(shownTotal)}
            </Text>
            <Text style={[typography.headlineMd, { color: colors.outline }]}>
              {' '}
              / {formatVolume(today.goalMl, unit)}
            </Text>
          </View>
          <View style={[styles.row, { marginTop: spacing.sm }]}>
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: today.met ? colors.secondaryContainer : colors.surfaceContainer,
                },
              ]}
            >
              <Text
                style={[
                  typography.labelMd,
                  { color: today.met ? colors.onSecondaryContainer : colors.onSurfaceVariant },
                ]}
              >
                {today.percent}% reached
              </Text>
            </View>
            <Text style={[typography.bodySm, { color: colors.outline }]}>
              {remaining > 0
                ? `· ${formatVolume(remaining, unit)} remaining`
                : remaining < 0
                  ? `· Goal exceeded by +${formatVolume(-remaining, unit)}`
                  : '· Goal met'}
            </Text>
          </View>
          <Text
            style={[
              typography.bodyMd,
              { color: colors.onSurfaceVariant, marginTop: spacing.sm, textAlign: 'center' },
            ]}
          >
            {pipMessage(today.percent)}
          </Text>
        </View>

        {/* Quick log */}
        <View style={{ gap: spacing.sm }}>
          <Text
            accessibilityRole="header"
            style={[typography.headlineSm, { color: colors.onSurface }]}
          >
            Quick log
          </Text>
          <View style={styles.quick}>
            {cups.map((c) => (
              <QuickAddButton
                key={c.id}
                amountMl={c.amountMl}
                unit={unit}
                onAdd={(ml) => onAdd(ml)}
              />
            ))}
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setSheetKey((k) => k + 1);
              setSheet(true);
            }}
            style={[styles.other, { backgroundColor: colors.surfaceContainer }]}
          >
            <MaterialCommunityIcons name="plus-circle-outline" size={20} color={colors.primary} />
            <Text style={[typography.labelLg, { color: colors.onSurfaceVariant }]}>
              Other drink or custom amount
            </Text>
          </Pressable>
        </View>

        {/* Today's log */}
        <View style={{ gap: spacing.sm }}>
          <View style={[styles.row, { alignItems: 'baseline' }]}>
            <Text
              accessibilityRole="header"
              style={[typography.headlineSm, { color: colors.onSurface }]}
            >
              Today
            </Text>
            <Text style={[typography.labelSm, { color: colors.outline }]}>
              {today.logs.length === 0
                ? 'Nothing logged yet'
                : `${today.logs.length} ${today.logs.length === 1 ? 'sip' : 'sips'} logged`}
            </Text>
          </View>
          {today.logs.map((l) => (
            <LogRow
              key={l.id}
              log={l}
              drink={drinkById.get(l.drinkId)}
              unit={unit}
              onDelete={remove}
            />
          ))}
        </View>
      </ScrollView>

      {snack ? (
        <UndoSnackbar
          key={snack.id}
          message={snack.message}
          bottom={12}
          onUndo={() => {
            undo();
            setSnack(null);
          }}
          onHide={() => setSnack(null)}
        />
      ) : null}

      <AddDrinkSheet
        key={sheetKey}
        visible={sheet}
        onClose={() => setSheet(false)}
        onAdd={(ml, id) => {
          setSheet(false);
          onAdd(ml, id);
        }}
        drinks={drinks}
        cups={cups}
        unit={unit}
        goalMl={today.goalMl}
        premium={premium}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    minHeight: 32,
    borderRadius: 16,
  },
  card: { borderRadius: 48, alignItems: 'center' },
  total: { flexDirection: 'row', alignItems: 'baseline' },
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 },
  quick: { flexDirection: 'row', gap: 10 },
  other: {
    minHeight: 52,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});
