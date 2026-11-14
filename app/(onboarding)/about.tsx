import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { ChoiceCard, type IconName } from '@/components/choice-card';
import { Pip } from '@/components/pip';
import { Segmented } from '@/components/segmented';
import { Stepper } from '@/components/stepper';
import { useDraft } from '@/features/onboarding/draft-context';
import { OnboardingShell } from '@/features/onboarding/onboarding-shell';
import type { ActivityLevel, Climate } from '@/lib/goal';
import { kgToLb, lbToKg } from '@/lib/units';
import { useTheme } from '@/theme';

const ACTIVITY: { v: ActivityLevel; label: string; sub: string; icon: IconName }[] = [
  { v: 'low', label: 'Low', sub: 'Sedentary', icon: 'sofa-single-outline' },
  { v: 'moderate', label: 'Moderate', sub: '30–60 min', icon: 'walk' },
  { v: 'high', label: 'High', sub: 'Intense', icon: 'run-fast' },
];
const CLIMATE: { v: Climate; label: string; icon: IconName }[] = [
  { v: 'cool', label: 'Cool', icon: 'snowflake' },
  { v: 'mild', label: 'Mild', icon: 'weather-partly-cloudy' },
  { v: 'hot', label: 'Hot', icon: 'white-balance-sunny' },
];
const KG_RANGE = [30, 250] as const;

export default function AboutScreen() {
  const { colors, typography, spacing } = useTheme();
  const { draft, update } = useDraft();
  const next = () => router.push('/day');

  const isLb = draft.weightUnit === 'lb';
  const shown = Math.round(isLb ? kgToLb(draft.weightKg) : draft.weightKg);
  const setShown = (n: number) => {
    const kg = isLb ? lbToKg(n) : n;
    update({ weightKg: Math.min(KG_RANGE[1], Math.max(KG_RANGE[0], kg)) });
  };

  const label = [
    typography.labelMd,
    { color: colors.onSurfaceVariant, textTransform: 'uppercase' as const },
  ];
  return (
    <OnboardingShell
      step={2}
      onSkip={next}
      title="About you"
      subtitle="To calculate your baseline daily hydration need."
      footer={<Button label="Continue" onPress={next} />}
    >
      <View
        style={[
          styles.card,
          { backgroundColor: colors.surfaceContainerLowest, padding: spacing.md, gap: spacing.md },
        ]}
      >
        <View style={styles.rowBetween}>
          <Text style={label}>Your weight</Text>
          <Segmented
            accessibilityLabel="Weight unit"
            options={['kg', 'lb'] as const}
            value={draft.weightUnit}
            onChange={(weightUnit) => update({ weightUnit })}
          />
        </View>
        <Stepper
          label="weight"
          value={String(shown)}
          unit={draft.weightUnit}
          onDecrement={() => setShown(shown - 1)}
          onIncrement={() => setShown(shown + 1)}
        />
      </View>

      <View style={{ gap: spacing.sm }}>
        <Text style={label}>Daily activity level</Text>
        <View style={styles.row} accessibilityRole="radiogroup">
          {ACTIVITY.map((a) => (
            <ChoiceCard
              key={a.v}
              label={a.label}
              sublabel={a.sub}
              icon={a.icon}
              selected={draft.activity === a.v}
              onPress={() => update({ activity: a.v })}
            />
          ))}
        </View>
      </View>

      <View style={{ gap: spacing.sm }}>
        <View style={[styles.row, { alignItems: 'center' }]}>
          <Text style={[label, { flex: 1 }]}>Local climate</Text>
          {/* Pip reacts to the choice: a sweat drop when it's hot. */}
          <Pip
            size={40}
            mood={draft.climate === 'hot' ? 'okay' : 'happy'}
            sweat={draft.climate === 'hot'}
          />
        </View>
        <View style={styles.row} accessibilityRole="radiogroup">
          {CLIMATE.map((c) => (
            <ChoiceCard
              key={c.v}
              compact
              label={c.label}
              icon={c.icon}
              selected={draft.climate === c.v}
              onPress={() => update({ climate: c.v })}
            />
          ))}
        </View>
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 24 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  row: { flexDirection: 'row', gap: 10 },
});
