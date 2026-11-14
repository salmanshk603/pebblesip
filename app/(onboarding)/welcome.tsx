import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { AnimatedPip } from '@/features/hydration/animated-pip';
import { OnboardingShell } from '@/features/onboarding/onboarding-shell';
import { useTheme } from '@/theme';

export default function WelcomeScreen() {
  const { colors, typography, spacing } = useTheme();
  const next = () => router.push('/about');
  return (
    <OnboardingShell step={1} onSkip={next} footer={<Button label="Let's begin" onPress={next} />}>
      <View style={[styles.center, { gap: spacing.md }]}>
        <View style={[styles.halo, { backgroundColor: colors.surfaceContainerLow }]}>
          <AnimatedPip size={180} active sipKey={0} progress={0.8} />
        </View>
        <View style={[styles.pill, { backgroundColor: colors.secondaryContainer }]}>
          <Text style={[typography.labelMd, { color: colors.onSecondaryContainer }]}>
            STEP 1 OF 4
          </Text>
        </View>
        <Text
          accessibilityRole="header"
          style={[typography.displayMdMobile, { color: colors.onSurface }]}
        >
          Hi, I&apos;m Pip!
        </Text>
        <Text style={[typography.bodyLg, { color: colors.onSurfaceVariant, textAlign: 'center' }]}>
          Little sips, every day.{'\n'}Let&apos;s set your daily water goal.
        </Text>
        <Text style={[typography.labelMd, { color: colors.outline }]}>
          Takes less than 1 minute
        </Text>
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  halo: {
    width: 240,
    height: 240,
    borderRadius: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 },
});
