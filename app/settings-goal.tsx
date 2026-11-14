import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { Pip } from '@/components/pip';
import { Stepper } from '@/components/stepper';
import { getDb, getGoalMl, getSetting, setGoalMl, setSetting } from '@/db';
import { KEYS, storedSuggestedGoalMl } from '@/features/onboarding/onboarding';
import { syncReminders } from '@/features/reminders/reminders';
import { refreshWidgets } from '@/features/widgets/widget-task-handler';
import { emitDataChanged } from '@/lib/data-events';
import { GOAL_MAX_ML, GOAL_MIN_ML, GOAL_STEP_ML } from '@/lib/goal';
import { formatVolume, mlToOz, ozToMl } from '@/lib/units';
import { useTheme } from '@/theme';

/** Settings → Daily goal: follow the formula (Auto) or set it by hand. Applies from today. */
export default function GoalSettingsScreen() {
  const { colors, typography, spacing } = useTheme();
  const db = getDb();
  const oz = getSetting(db, KEYS.volumeUnit) === 'oz';
  const suggested = storedSuggestedGoalMl(db);
  const [goal, setGoal] = useState(() => getGoalMl(db));

  const clamp = (v: number) => Math.min(GOAL_MAX_ML, Math.max(GOAL_MIN_ML, v));
  const step = (dir: 1 | -1) =>
    setGoal((g) => clamp(oz ? ozToMl(Math.round(mlToOz(g)) + dir) : g + dir * GOAL_STEP_ML));

  const save = (ml: number, manual: boolean) => {
    setGoalMl(db, ml);
    setSetting(db, KEYS.goalManual, manual ? '1' : '0');
    emitDataChanged();
    void refreshWidgets();
    void syncReminders(); // the goal-met pause depends on it
    router.back();
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Daily goal' }} />
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={{ padding: spacing.margin, gap: spacing.md, alignItems: 'center' }}
      >
        <Pip size={96} />
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surfaceContainerLowest,
              padding: spacing.lg,
              gap: spacing.sm,
            },
          ]}
        >
          <Stepper
            label="daily goal"
            value={oz ? String(Math.round(mlToOz(goal))) : goal.toLocaleString('en-US')}
            unit={oz ? 'oz' : 'ml'}
            onDecrement={() => step(-1)}
            onIncrement={() => step(1)}
          />
          <Text
            style={[typography.bodySm, { color: colors.onSurfaceVariant, textAlign: 'center' }]}
          >
            Suggested for you: {formatVolume(suggested, oz ? 'oz' : 'ml')}. Changes apply from
            today; past days keep their goal.
          </Text>
        </View>
        <View style={{ alignSelf: 'stretch', gap: spacing.sm }}>
          <Button label="Save my goal" onPress={() => save(goal, goal !== suggested)} />
          <Button
            variant="ghost"
            label={`Use suggested (${formatVolume(suggested, oz ? 'oz' : 'ml')})`}
            onPress={() => save(suggested, false)}
          />
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 24, alignSelf: 'stretch' },
});
