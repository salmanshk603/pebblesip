import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import Constants from 'expo-constants';
import { getPermissionsAsync, requestPermissionsAsync } from 'expo-notifications';
import { router, useFocusEffect } from 'expo-router';
import { type ComponentProps, type ReactNode, useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Segmented } from '@/components/segmented';
import {
  getCups,
  getDb,
  getGoalMl,
  getSetting,
  resetDay,
  seed,
  setSetting,
  wipeAllData,
} from '@/db';
import { privacyOptionsRequired, showPrivacyOptions } from '@/features/ads/ads';
import { seedSampleHistory } from '@/features/dev/sample-data';
import { getFastingConfig } from '@/features/fasting/fasting';
import { formatTime, KEYS as ONBOARDING_KEYS, parseTime } from '@/features/onboarding/onboarding';
import {
  DEV_PREMIUM_KEY,
  isPremium,
  notifyPremiumChanged,
  usePremium,
} from '@/features/premium/use-premium';
import { intervalLabel, REMINDER_INTERVALS } from '@/features/reminders/plan';
import {
  getReminderSettings,
  sendTestReminder,
  setReminderSettings,
  syncReminders,
  type ReminderSettings,
} from '@/features/reminders/reminders';
import { exportCsv } from '@/features/stats/export-csv';
import { getWidgetData } from '@/features/widgets/widget-data';
import { refreshWidgets } from '@/features/widgets/widget-task-handler';
import { emitDataChanged } from '@/lib/data-events';
import { LINKS } from '@/lib/links';
import { formatVolume, type VolumeUnit } from '@/lib/units';
import { CHEVRON_FORWARD } from '@/lib/rtl';
import { useTheme } from '@/theme';
import { getThemePref, setThemePref, type ThemePref } from '@/theme/preference';

type Icon = ComponentProps<typeof MaterialCommunityIcons>['name'];
const THEME_LABELS = { light: 'Light', dark: 'Dark', system: 'System' } as const;
const THEME_OPTIONS = ['Light', 'Dark', 'System'] as const;
type TimeField = 'wake' | 'sleep';

function readState() {
  const db = getDb();
  const unit: VolumeUnit = getSetting(db, ONBOARDING_KEYS.volumeUnit) === 'oz' ? 'oz' : 'ml';
  const fasting = getFastingConfig(db);
  return {
    unit,
    goalMl: getGoalMl(db),
    goalAuto: getSetting(db, ONBOARDING_KEYS.goalManual) !== '1',
    cups: getCups(db).map((c) => c.amountMl),
    wake: getSetting(db, ONBOARDING_KEYS.wakeTime) ?? '07:00',
    sleep: getSetting(db, ONBOARDING_KEYS.sleepTime) ?? '23:00',
    fastingOn: fasting.enabled,
    fastingMode: fasting.mode,
    theme: getThemePref(db),
    // The theme widgets actually draw (Premium themes fall back without Premium or a trial).
    widgetTheme: getWidgetData(db, isPremium()).theme.name,
  };
}

export default function SettingsScreen() {
  const { colors, typography, spacing } = useTheme();
  const premium = usePremium();
  const [s, setS] = useState(readState);
  const [rem, setRem] = useState<ReminderSettings>(() => getReminderSettings(getDb()));
  const [granted, setGranted] = useState<boolean | null>(null);
  const [scheduled, setScheduled] = useState<number | null>(null);
  const [picking, setPicking] = useState<TimeField | null>(null);
  const [privacyRequired, setPrivacyRequired] = useState(false);
  const [seeded, setSeeded] = useState<number | null>(null);
  const [devPremium, setDevPremium] = useState(() => getSetting(getDb(), DEV_PREMIUM_KEY) === '1');
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    void privacyOptionsRequired().then(setPrivacyRequired);
  }, []);
  useFocusEffect(
    useCallback(() => {
      setS(readState());
      void getPermissionsAsync().then((p) => setGranted(p.granted));
    }, []),
  );

  const reload = () => setS(readState());
  const resync = () => void syncReminders().then(setScheduled);

  const updateRem = (patch: Partial<ReminderSettings>) => {
    setReminderSettings(getDb(), patch);
    setRem(getReminderSettings(getDb()));
    resync();
  };
  const enable = async (on: boolean) => {
    if (on && !granted) {
      const p = await requestPermissionsAsync();
      setGranted(p.granted);
      if (!p.granted) return;
    }
    updateRem({ enabled: on });
  };
  const setUnit = (u: VolumeUnit) => {
    setSetting(getDb(), ONBOARDING_KEYS.volumeUnit, u);
    reload();
    emitDataChanged();
    void refreshWidgets();
    resync(); // the "+250 ml" button label follows the unit
  };
  const onTime = (e: DateTimePickerEvent, date?: Date) => {
    const which = picking;
    setPicking(null);
    if (e.type !== 'set' || !date || !which) return;
    const v = formatTime(date.getHours(), date.getMinutes());
    const other = which === 'wake' ? s.sleep : s.wake;
    if (v === other) return setMsg('Wake-up time and bedtime must be different.');
    setMsg(null);
    setSetting(getDb(), which === 'wake' ? ONBOARDING_KEYS.wakeTime : ONBOARDING_KEYS.sleepTime, v);
    reload();
    resync();
  };
  const setTheme = (label: (typeof THEME_OPTIONS)[number]) => {
    const pref = (Object.keys(THEME_LABELS) as ThemePref[]).find((k) => THEME_LABELS[k] === label)!;
    setThemePref(getDb(), pref);
    reload();
  };

  const onExport = async () => {
    if (!premium) return router.push('/paywall');
    const r = await exportCsv();
    setMsg(
      r === 'empty' ? 'Nothing logged yet.' : r === 'error' ? "Couldn't export right now." : null,
    );
  };
  const confirmResetToday = () =>
    Alert.alert(
      'Reset today?',
      "This removes every drink logged today. Other days aren't affected.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset today',
          style: 'destructive',
          onPress: () => {
            const n = resetDay(getDb());
            emitDataChanged();
            void refreshWidgets();
            resync();
            setMsg(`Today reset (${n} ${n === 1 ? 'drink' : 'drinks'} removed).`);
          },
        },
      ],
    );
  const confirmDeleteAll = () =>
    Alert.alert(
      'Delete all data?',
      'This permanently deletes every log, your goal and all settings on this phone. It cannot be undone. Purchases stay with your Google account and can be restored.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete everything',
          style: 'destructive',
          onPress: () => {
            const db = getDb();
            wipeAllData(db);
            seed(db);
            setThemePref(db, 'system');
            notifyPremiumChanged();
            emitDataChanged();
            void syncReminders(); // onboarding is reset, so this cancels every reminder
            void refreshWidgets();
            router.replace('/welcome');
          },
        },
      ],
    );

  const open = (url: string) =>
    void Linking.openURL(url).catch(() => setMsg("Couldn't open the link."));
  const version = `${Constants.expoConfig?.version ?? '?'}${
    Constants.nativeBuildVersion ? ` (Build ${Constants.nativeBuildVersion})` : ''
  }`;

  // ---------- small building blocks ----------
  const section = (title: string) => (
    <Text
      accessibilityRole="header"
      style={[typography.labelMd, styles.section, { color: colors.onSurfaceVariant }]}
    >
      {title}
    </Text>
  );
  const card = (children: ReactNode) => (
    <View style={[styles.card, { backgroundColor: colors.surfaceContainerLowest }]}>
      {children}
    </View>
  );
  const divider = (
    <View style={[styles.divider, { backgroundColor: colors.surfaceContainerHigh }]} />
  );
  const row = (
    icon: Icon,
    title: string,
    opts: {
      value?: string;
      sub?: string;
      onPress?: () => void;
      right?: ReactNode;
      danger?: boolean;
      external?: boolean;
      locked?: boolean;
    } = {},
  ) => (
    <Pressable
      accessibilityRole={opts.onPress ? (opts.external ? 'link' : 'button') : undefined}
      accessibilityLabel={[title, opts.value, opts.locked ? 'Premium' : undefined]
        .filter(Boolean)
        .join(', ')}
      disabled={!opts.onPress}
      onPress={opts.onPress}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
    >
      <MaterialCommunityIcons
        name={icon}
        size={22}
        color={opts.danger ? colors.error : colors.primary}
      />
      <View style={{ flex: 1 }}>
        <Text style={[typography.bodyLg, { color: opts.danger ? colors.error : colors.onSurface }]}>
          {title}
        </Text>
        {opts.sub ? (
          <Text style={[typography.bodySm, { color: colors.onSurfaceVariant }]}>{opts.sub}</Text>
        ) : null}
      </View>
      {opts.value ? (
        <Text style={[typography.labelLg, { color: colors.onSurfaceVariant }]}>{opts.value}</Text>
      ) : null}
      {opts.locked ? (
        <MaterialCommunityIcons name="lock-outline" size={18} color={colors.outline} />
      ) : null}
      {opts.right ??
        (opts.onPress ? (
          <MaterialCommunityIcons
            name={opts.external ? 'open-in-new' : CHEVRON_FORWARD}
            size={20}
            color={colors.outline}
          />
        ) : null)}
    </Pressable>
  );
  const toggle = (label: string, value: boolean, onChange: (v: boolean) => void) => (
    <Switch
      accessibilityLabel={label}
      value={value}
      onValueChange={onChange}
      trackColor={{ true: colors.primaryContainer, false: colors.outlineVariant }}
      thumbColor={value ? colors.primary : colors.surfaceContainerHigh}
    />
  );
  const pickVal = picking ? parseTime(picking === 'wake' ? s.wake : s.sleep) : null;

  return (
    <SafeAreaView edges={['top']} style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ padding: spacing.margin, gap: spacing.sm }}>
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
            styles.row,
            styles.premium,
            { backgroundColor: colors.secondaryContainer },
          ]}
        >
          <MaterialCommunityIcons
            name="star-four-points-outline"
            size={24}
            color={colors.primary}
          />
          <View style={{ flex: 1 }}>
            <Text style={[typography.headlineSm, { color: colors.onSecondaryContainer }]}>
              Pebblesip Premium
            </Text>
            <Text style={[typography.bodySm, { color: colors.onSecondaryContainer }]}>
              {premium
                ? 'Active. Manage or restore purchases.'
                : 'All widget themes, fasting modes, full stats, no ads.'}
            </Text>
          </View>
          <MaterialCommunityIcons name={CHEVRON_FORWARD} size={22} color={colors.outline} />
        </Pressable>

        {section('Goal & units')}
        {card(
          <>
            {row('flag-outline', 'Daily goal', {
              value: `${formatVolume(s.goalMl, s.unit)}${s.goalAuto ? ' (Auto)' : ''}`,
              onPress: () => router.push('/settings-goal'),
            })}
            {divider}
            {row('ruler', 'Units', {
              right: (
                <View style={{ width: 120 }}>
                  <Segmented
                    options={['ml', 'oz'] as const}
                    value={s.unit}
                    onChange={setUnit}
                    accessibilityLabel="Volume unit"
                  />
                </View>
              ),
            })}
            {divider}
            {row('cup-outline', 'Cup sizes', {
              value: s.cups.map((ml) => formatVolume(ml, s.unit)).join(' · '),
              onPress: () => router.push('/settings-cups'),
            })}
          </>,
        )}

        {section('Reminders')}
        {card(
          <>
            {row('bell-outline', 'Reminders', {
              sub: 'Only between wake-up and bedtime. Pauses once the goal is met.',
              onPress: () => void enable(!(rem.enabled && granted !== false)),
              right: toggle('Reminders', rem.enabled && granted !== false, (v) => void enable(v)),
            })}
            {granted === false
              ? row('bell-off-outline', 'Notifications are off', {
                  sub: 'Tap to open system settings.',
                  danger: true,
                  onPress: () => void Linking.openSettings(),
                })
              : null}
            {divider}
            <View style={[styles.chipsWrap, { opacity: rem.enabled ? 1 : 0.5 }]}>
              <Text style={[typography.bodyLg, { color: colors.onSurface }]}>Remind me every</Text>
              <View style={styles.chips} accessibilityRole="radiogroup">
                {REMINDER_INTERVALS.map((m) => {
                  const on = rem.intervalMin === m;
                  return (
                    <Pressable
                      key={m}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: on, disabled: !rem.enabled }}
                      disabled={!rem.enabled}
                      onPress={() => updateRem({ intervalMin: m })}
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
            {divider}
            {row('weather-sunny', 'Wake-up time', {
              value: s.wake,
              onPress: () => setPicking('wake'),
            })}
            {row('weather-night', 'Bedtime', {
              value: s.sleep,
              onPress: () => setPicking('sleep'),
            })}
            {divider}
            {row('volume-high', 'Reminder sound', {
              onPress: () => updateRem({ sound: !rem.sound }),
              right: toggle('Reminder sound', rem.sound, (v) => updateRem({ sound: v })),
            })}
            {divider}
            {row('battery-alert-variant-outline', 'Reminders not arriving?', {
              sub: 'Battery optimisation guide',
              onPress: () => router.push('/battery-help'),
            })}
            {scheduled !== null ? (
              <Text style={[typography.bodySm, styles.note, { color: colors.outline }]}>
                {scheduled} reminders scheduled.
              </Text>
            ) : null}
          </>,
        )}

        {section('Fasting mode')}
        {card(
          row('moon-waning-crescent', 'Fasting mode', {
            sub: 'Reminders only in your eating window',
            value: s.fastingOn
              ? `${{ manual: 'Manual', if: 'IF', ramadan: 'Ramadan' }[s.fastingMode]} · On`
              : 'Off',
            onPress: () => router.push('/fasting'),
          }),
        )}

        {section('Appearance')}
        {card(
          <>
            {row('palette-outline', 'App theme', {
              right: (
                <View style={{ width: 186 }}>
                  <Segmented
                    options={THEME_OPTIONS}
                    value={THEME_LABELS[s.theme]}
                    onChange={setTheme}
                    accessibilityLabel="App theme"
                  />
                </View>
              ),
            })}
            {divider}
            {row('widgets-outline', 'Widget theme', {
              value: s.widgetTheme,
              onPress: () => router.push('/widgets'),
            })}
          </>,
        )}

        {section('Data')}
        {card(
          <>
            {row('download-outline', 'Export CSV', {
              locked: !premium,
              onPress: () => void onExport(),
            })}
            {divider}
            {row('backup-restore', 'Reset today', { onPress: confirmResetToday })}
            {divider}
            {row('delete-outline', 'Delete all data', { danger: true, onPress: confirmDeleteAll })}
          </>,
        )}
        {msg ? (
          <Text
            accessibilityLiveRegion="polite"
            style={[typography.bodySm, { color: colors.primary }]}
          >
            {msg}
          </Text>
        ) : null}

        {section('About')}
        {card(
          <>
            {row('star-outline', 'Rate Pebblesip', {
              external: true,
              onPress: () => open(LINKS.playStore),
            })}
            {LINKS.supportEmail ? (
              <>
                {divider}
                {row('email-outline', 'Contact support', {
                  external: true,
                  onPress: () => open(`mailto:${LINKS.supportEmail}?subject=Pebblesip%20support`),
                })}
              </>
            ) : null}
            {LINKS.privacyPolicy ? (
              <>
                {divider}
                {row('lock-outline', 'Privacy policy', {
                  external: true,
                  onPress: () => open(LINKS.privacyPolicy!),
                })}
              </>
            ) : null}
            {LINKS.terms ? (
              <>
                {divider}
                {row('file-document-outline', 'Terms of service', {
                  external: true,
                  onPress: () => open(LINKS.terms!),
                })}
              </>
            ) : null}
            {privacyRequired ? (
              <>
                {divider}
                {row('shield-account-outline', 'Ad privacy choices', {
                  onPress: () => void showPrivacyOptions(),
                })}
              </>
            ) : null}
            {divider}
            {row('information-outline', 'Version', { value: version })}
          </>,
        )}
        <Text style={[typography.bodySm, styles.disclaimer, { color: colors.outline }]}>
          Pebblesip is a habit tracker, not medical advice. Ask a doctor about your fluid needs.
        </Text>

        {__DEV__ ? (
          <>
            {section('Developer')}
            {card(
              <>
                {row('bug-outline', 'Send test reminder in 5 s', {
                  onPress: () => void sendTestReminder(5),
                })}
                {divider}
                {row('bug-outline', 'Pretend Premium', {
                  right: toggle('Dev: pretend Premium', devPremium, (v) => {
                    setSetting(getDb(), DEV_PREMIUM_KEY, v ? '1' : '0');
                    setDevPremium(v);
                    notifyPremiumChanged();
                    resync();
                    void refreshWidgets();
                  }),
                })}
                {divider}
                {row('bug-outline', 'Add 60 days of sample history', {
                  value: seeded !== null ? `${seeded} added` : undefined,
                  onPress: () => {
                    const n = seedSampleHistory(getDb());
                    emitDataChanged();
                    void refreshWidgets();
                    setSeeded(n);
                  },
                })}
              </>,
            )}
          </>
        ) : null}

        <View style={styles.footer}>
          <Text style={[typography.headlineSm, { color: colors.primary }]}>A sip for now.</Text>
        </View>
      </ScrollView>
      {pickVal ? (
        <DateTimePicker
          mode="time"
          value={new Date(2000, 0, 1, pickVal.h, pickVal.m)}
          onChange={onTime}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  card: { borderRadius: 24, paddingHorizontal: 16, paddingVertical: 4 },
  premium: { paddingVertical: 16 },
  section: { textTransform: 'uppercase', marginTop: 12, marginLeft: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 56, paddingVertical: 8 },
  divider: { height: 1, marginLeft: 36 },
  chipsWrap: { gap: 8, paddingVertical: 12 },
  chips: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: {
    minHeight: 48,
    paddingHorizontal: 16,
    borderRadius: 22,
    borderWidth: 2,
    justifyContent: 'center',
  },
  note: { paddingBottom: 12 },
  disclaimer: { textAlign: 'center', marginTop: 8 },
  footer: { alignItems: 'center', paddingVertical: 24 },
});
