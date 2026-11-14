import { MaterialCommunityIcons } from '@expo/vector-icons';
import { requestPermissionsAsync } from 'expo-notifications';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { getDb } from '@/db';
import { useDraft } from '@/features/onboarding/draft-context';
import { track } from '@/lib/analytics';
import { completeOnboarding } from '@/features/onboarding/onboarding';
import { OnboardingShell } from '@/features/onboarding/onboarding-shell';
import { ensureReminderChannel, syncReminders } from '@/features/reminders/reminders';
import { useTheme } from '@/theme';

export default function NotificationsScreen() {
  const { colors, typography, spacing } = useTheme();
  const { draft } = useDraft();
  const [denied, setDenied] = useState(false);
  const [busy, setBusy] = useState(false);

  const finish = () => {
    completeOnboarding(getDb(), draft);
    track('onboarding_completed');
    void syncReminders();
    // PRD flow: paywall (dismissible) after onboarding, then Home.
    router.replace({ pathname: '/paywall', params: { from: 'onboarding' } });
  };

  const allow = async () => {
    setBusy(true);
    try {
      // Android 13+ only shows the system prompt once a channel exists.
      await ensureReminderChannel(draft.volumeUnit);
      const { granted } = await requestPermissionsAsync();
      if (granted) finish();
      else setDenied(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <OnboardingShell
      title="Gentle reminders"
      subtitle="Pebblesip can nudge you to sip between your wake-up time and bedtime. Never at night."
      footer={
        denied ? (
          <Button label="Continue to Pebblesip" onPress={finish} />
        ) : (
          <>
            <Button label="Allow notifications" onPress={allow} disabled={busy} />
            <Button label="Not now" variant="ghost" onPress={finish} disabled={busy} />
          </>
        )
      }
    >
      <View style={[styles.center, { gap: spacing.md }]}>
        <View style={[styles.icon, { backgroundColor: colors.secondaryContainer }]}>
          <MaterialCommunityIcons name="bell-ring-outline" size={48} color={colors.primary} />
        </View>
        {denied ? (
          <Text
            style={[typography.bodyMd, { color: colors.onSurfaceVariant, textAlign: 'center' }]}
          >
            No problem. You can turn reminders on any time in Settings.
          </Text>
        ) : (
          <Text
            style={[typography.bodyMd, { color: colors.onSurfaceVariant, textAlign: 'center' }]}
          >
            We only use notifications for water reminders. You choose how often in Settings.
          </Text>
        )}
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  icon: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
