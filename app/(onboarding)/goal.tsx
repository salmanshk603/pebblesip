import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { Pip } from '@/components/pip';
import { Stepper } from '@/components/stepper';
import { useDraft } from '@/features/onboarding/draft-context';
import { finalGoalMl, suggestedGoalMl } from '@/features/onboarding/onboarding';
import { OnboardingShell } from '@/features/onboarding/onboarding-shell';
import { GOAL_MAX_ML, GOAL_MIN_ML, GOAL_STEP_ML } from '@/lib/goal';
import { mlToOz, ozToMl } from '@/lib/units';
import { useTheme } from '@/theme';

export default function GoalScreen() {
  const { colors, typography, spacing } = useTheme();
  const { draft, update } = useDraft();
  const goal = finalGoalMl(draft);
  const oz = draft.volumeUnit === 'oz';

  const step = (dir: 1 | -1) => {
    const next = oz ? ozToMl(Math.round(mlToOz(goal)) + dir) : goal + dir * GOAL_STEP_ML;
    update({ goalOverrideMl: Math.min(GOAL_MAX_ML, Math.max(GOAL_MIN_ML, next)) });
  };
  const shown = oz ? String(Math.round(mlToOz(goal))) : goal.toLocaleString('en-US');
  const edited =
    draft.goalOverrideMl !== undefined && draft.goalOverrideMl !== suggestedGoalMl(draft);

  return (
    <OnboardingShell
      title="Your daily goal"
      subtitle={`Based on ${Math.round(draft.weightKg)} kg, ${draft.activity} activity and a ${draft.climate} climate.`}
      footer={<Button label="Looks good" onPress={() => router.push('/notifications')} />}
    >
      <View style={[styles.center, { gap: spacing.md }]}>
        <Pip size={120} />
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
            value={shown}
            unit={oz ? 'oz' : 'ml'}
            onDecrement={() => step(-1)}
            onIncrement={() => step(1)}
          />
          {edited ? (
            <Text
              accessibilityRole="button"
              onPress={() => update({ goalOverrideMl: undefined })}
              style={[
                typography.labelMd,
                { color: colors.primary, textAlign: 'center', paddingVertical: 8 },
              ]}
            >
              Reset to suggested
            </Text>
          ) : (
            <Text
              style={[typography.bodySm, { color: colors.onSurfaceVariant, textAlign: 'center' }]}
            >
              Adjust it any time.
            </Text>
          )}
        </View>
        <Text style={[typography.bodySm, { color: colors.outline, textAlign: 'center' }]}>
          General guidance, not medical advice.
        </Text>
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { borderRadius: 24, alignSelf: 'stretch' },
});
