import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { Stepper } from '@/components/stepper';
import { getCups, getDb, getSetting, setCupAmounts } from '@/db';
import { KEYS } from '@/features/onboarding/onboarding';
import { refreshWidgets } from '@/features/widgets/widget-task-handler';
import { emitDataChanged } from '@/lib/data-events';
import { mlToOz, ozToMl } from '@/lib/units';
import { useTheme } from '@/theme';

const MIN_ML = 50;
const MAX_ML = 1500;

/** Settings → Cup sizes: the three quick-add amounts (Home and the wide widget). */
export default function CupSettingsScreen() {
  const { colors, typography, spacing } = useTheme();
  const db = getDb();
  const oz = getSetting(db, KEYS.volumeUnit) === 'oz';
  const [cups, setCups] = useState(() => getCups(db).map((c) => c.amountMl));

  const step = (i: number, dir: 1 | -1) =>
    setCups((cs) =>
      cs.map((ml, j) => {
        if (j !== i) return ml;
        const next = oz ? ozToMl(Math.round(mlToOz(ml)) + dir) : ml + dir * 50;
        return Math.min(MAX_ML, Math.max(MIN_ML, Math.round(next)));
      }),
    );

  const save = () => {
    setCupAmounts(db, cups);
    emitDataChanged();
    void refreshWidgets();
    router.back();
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Cup sizes' }} />
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={{ padding: spacing.margin, gap: spacing.md }}
      >
        <Text style={[typography.bodyMd, { color: colors.onSurfaceVariant }]}>
          These are your quick-add buttons on Home and on the wide widget.
        </Text>
        {cups.map((ml, i) => (
          <View
            key={i}
            style={[
              styles.card,
              { backgroundColor: colors.surfaceContainerLowest, padding: spacing.md },
            ]}
          >
            <Text style={[typography.labelLg, { color: colors.onSurfaceVariant }]}>
              Cup {i + 1}
            </Text>
            <Stepper
              label={`cup ${i + 1}`}
              value={oz ? String(Math.round(mlToOz(ml))) : String(ml)}
              unit={oz ? 'oz' : 'ml'}
              onDecrement={() => step(i, -1)}
              onIncrement={() => step(i, 1)}
            />
          </View>
        ))}
        <Button label="Save" onPress={save} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 24, gap: 8 },
});
