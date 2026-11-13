import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getPermissionsAsync, requestPermissionsAsync } from 'expo-notifications';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getDb, getSetting, setSetting } from '@/db';
import { seedSampleHistory } from '@/features/dev/sample-data';
import { privacyOptionsRequired, showPrivacyOptions } from '@/features/ads/ads';
import { DEV_PREMIUM_KEY, notifyPremiumChanged, usePremium } from '@/features/premium/use-premium';
import { intervalLabel, REMINDER_INTERVALS } from '@/features/reminders/plan';
import {
  getReminderSettings,
  sendTestReminder,
  setReminderSettings,
  syncReminders,
  type ReminderSettings,
} from '@/features/reminders/reminders';
import { refreshWidgets } from '@/features/widgets/widget-task-handler';
import { emitDataChanged } from '@/lib/data-events';
import { useTheme } from '@/theme';

/** Phase 5 scope: the Reminders section. The full Settings screen is Phase 10. */
export default function SettingsScreen() {
  const { colors, typography, spacing } = useTheme();
  const [settings, setSettings] = useState<ReminderSettings>(() => getReminderSettings(getDb()));
  const [granted, setGranted] = useState<boolean | null>(null);
  const [scheduled, setScheduled] = useState<number | null>(null);
  const premium = usePremium();
  const [privacyRequired, setPrivacyRequired] = useState(false);
  useEffect(() => {
    void privacyOptionsRequired().then(setPrivacyRequired);
  }, []);
  const [seeded, setSeeded] = useState<number | null>(null);
  const [devPremium, setDevPremium] = useState(() => getSetting(getDb(), DEV_PREMIUM_KEY) === '1');

  const refreshPermission = useCallback(() => {
    void getPermissionsAsync().then((p) => setGranted(p.granted));
  }, []);
  useFocusEffect(refreshPermission);

  const update = (patch: Partial<ReminderSettings>) => {
    setReminderSettings(getDb(), patch);
    setSettings(getReminderSettings(getDb()));
    void syncReminders().then(setScheduled);
  };

  const enable = async (on: boolean) => {
    if (on && !granted) {
      const p = await requestPermissionsAsync();
      setGranted(p.granted);
      if (!p.granted) return;
    }
    update({ enabled: on });
  };

  const label = [
    typography.labelMd,
    { color: colors.onSurfaceVariant, textTransform: 'uppercase' as const },
  ];
  return (
    <SafeAreaView edges={['top']} style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ padding: spacing.margin, gap: spacing.md }}>
        <Text
          accessibilityRole="header"
          style={[typography.headlineLg, { color: colors.onSurface }]}
        >
          Settings
        </Text>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/paywall')}
          style={[
            styles.card,
            styles.link,
            { backgroundColor: colors.secondaryContainer, padding: spacing.md },
          ]}
        >
          <MaterialCommunityIcons
            name="star-four-points-outline"
            size={22}
            color={colors.primary}
          />
          <Text style={[typography.labelLg, { color: colors.onSecondaryContainer, flex: 1 }]}>
            {premium ? 'Pebblesip Premium: active' : 'Get Pebblesip Premium'}
          </Text>
          <MaterialCommunityIcons name="chevron-right" size={22} color={colors.outline} />
        </Pressable>

        <Text style={label}>Reminders</Text>
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surfaceContainerLowest,
              padding: spacing.md,
              gap: spacing.md,
            },
          ]}
        >
          <View style={styles.rowBetween}>
            <View style={{ flex: 1 }}>
              <Text style={[typography.labelLg, { color: colors.onSurface }]}>Water reminders</Text>
              <Text style={[typography.bodySm, { color: colors.onSurfaceVariant }]}>
                Only between your wake-up time and bedtime. Pauses once today&apos;s goal is met.
              </Text>
            </View>
            <Switch
              accessibilityLabel="Water reminders"
              value={settings.enabled && granted !== false}
              onValueChange={(v) => void enable(v)}
              trackColor={{ true: colors.primaryContainer, false: colors.outlineVariant }}
              thumbColor={settings.enabled ? colors.primary : colors.surfaceContainerHigh}
            />
          </View>

          {granted === false ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => void Linking.openSettings()}
              style={styles.row}
            >
              <MaterialCommunityIcons name="bell-off-outline" size={18} color={colors.error} />
              <Text style={[typography.bodySm, { color: colors.error, flex: 1 }]}>
                Notifications are off for Pebblesip. Tap to open system settings.
              </Text>
            </Pressable>
          ) : null}

          <View style={{ gap: spacing.sm, opacity: settings.enabled ? 1 : 0.5 }}>
            <Text style={[typography.labelLg, { color: colors.onSurface }]}>Remind me every</Text>
            <View style={styles.chips} accessibilityRole="radiogroup">
              {REMINDER_INTERVALS.map((m) => {
                const on = settings.intervalMin === m;
                return (
                  <Pressable
                    key={m}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: on, disabled: !settings.enabled }}
                    disabled={!settings.enabled}
                    onPress={() => update({ intervalMin: m })}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: on
                          ? colors.secondaryContainer
                          : colors.surfaceContainerLow,
                        borderColor: on ? colors.primaryContainer : 'transparent',
                      },
                    ]}
                  >
                    <Text style={[typography.labelLg, { color: colors.onSurface }]}>
                      {intervalLabel(m)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
          {scheduled !== null ? (
            <Text style={[typography.bodySm, { color: colors.outline }]}>
              {scheduled} reminders scheduled.
            </Text>
          ) : null}
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/fasting')}
          style={[
            styles.card,
            styles.link,
            { backgroundColor: colors.surfaceContainerLowest, padding: spacing.md },
          ]}
        >
          <MaterialCommunityIcons name="weather-night" size={22} color={colors.primary} />
          <Text style={[typography.labelLg, { color: colors.onSurface, flex: 1 }]}>
            Fasting mode
          </Text>
          <MaterialCommunityIcons name="chevron-right" size={22} color={colors.outline} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/battery-help')}
          style={[
            styles.card,
            styles.link,
            { backgroundColor: colors.surfaceContainerLowest, padding: spacing.md },
          ]}
        >
          <MaterialCommunityIcons
            name="battery-alert-variant-outline"
            size={22}
            color={colors.primary}
          />
          <Text style={[typography.labelLg, { color: colors.onSurface, flex: 1 }]}>
            Reminders not arriving?
          </Text>
          <MaterialCommunityIcons name="chevron-right" size={22} color={colors.outline} />
        </Pressable>

        {privacyRequired ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => void showPrivacyOptions()}
            style={[
              styles.card,
              styles.link,
              { backgroundColor: colors.surfaceContainerLowest, padding: spacing.md },
            ]}
          >
            <MaterialCommunityIcons
              name="shield-account-outline"
              size={22}
              color={colors.primary}
            />
            <Text style={[typography.labelLg, { color: colors.onSurface, flex: 1 }]}>
              Ad privacy choices
            </Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.outline} />
          </Pressable>
        ) : null}

        {__DEV__ ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => void sendTestReminder(5)}
            style={[
              styles.card,
              styles.link,
              { backgroundColor: colors.surfaceContainer, padding: spacing.md },
            ]}
          >
            <MaterialCommunityIcons name="bug-outline" size={22} color={colors.outline} />
            <Text style={[typography.labelLg, { color: colors.onSurfaceVariant }]}>
              Dev: send test reminder in 5 s
            </Text>
          </Pressable>
        ) : null}
        {__DEV__ ? (
          <View
            style={[
              styles.card,
              styles.link,
              { backgroundColor: colors.surfaceContainer, padding: spacing.md },
            ]}
          >
            <MaterialCommunityIcons name="bug-outline" size={22} color={colors.outline} />
            <Text style={[typography.labelLg, { color: colors.onSurfaceVariant, flex: 1 }]}>
              Dev: pretend Premium
            </Text>
            <Switch
              accessibilityLabel="Dev: pretend Premium"
              value={devPremium}
              onValueChange={(v) => {
                setSetting(getDb(), DEV_PREMIUM_KEY, v ? '1' : '0');
                setDevPremium(v);
                notifyPremiumChanged();
                void syncReminders().then(setScheduled);
                void refreshWidgets();
              }}
            />
          </View>
        ) : null}
        {__DEV__ ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              const n = seedSampleHistory(getDb());
              emitDataChanged();
              void refreshWidgets();
              setSeeded(n);
            }}
            style={[
              styles.card,
              styles.link,
              { backgroundColor: colors.surfaceContainer, padding: spacing.md },
            ]}
          >
            <MaterialCommunityIcons name="bug-outline" size={22} color={colors.outline} />
            <Text style={[typography.labelLg, { color: colors.onSurfaceVariant, flex: 1 }]}>
              Dev: add 60 days of sample history{seeded !== null ? ` (${seeded} added)` : ''}
            </Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  card: { borderRadius: 24 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  chips: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 22,
    borderWidth: 2,
    justifyContent: 'center',
  },
  link: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56 },
});
