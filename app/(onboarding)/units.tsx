import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ChoiceCard } from '@/components/choice-card';
import { useDraft } from '@/features/onboarding/draft-context';
import { OnboardingShell } from '@/features/onboarding/onboarding-shell';

export default function UnitsScreen() {
  const { draft, update } = useDraft();
  const next = () => router.push('/goal');
  return (
    <OnboardingShell
      step={4}
      onSkip={next}
      title="Your units"
      subtitle="How should Pebblesip show amounts? You can change this later."
      footer={<Button label="Continue" onPress={next} />}
    >
      <View style={styles.row} accessibilityRole="radiogroup">
        <ChoiceCard
          label="Millilitres"
          sublabel="ml"
          icon="cup-water"
          selected={draft.volumeUnit === 'ml'}
          onPress={() => update({ volumeUnit: 'ml' })}
        />
        <ChoiceCard
          label="Ounces"
          sublabel="fl oz"
          icon="glass-mug-variant"
          selected={draft.volumeUnit === 'oz'}
          onPress={() => update({ volumeUnit: 'oz' })}
        />
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', gap: 12 } });
