import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as Location from 'expo-location';
import { router, Stack } from 'expo-router';
import { type ReactNode, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { getDb, getGoalMl, getSetting } from '@/db';
import { getFastingConfig, setFastingConfig } from '@/features/fasting/fasting';
import {
  CALC_METHODS,
  type CalcMethod,
  CITIES,
  eatingWindow,
  effectiveMode,
  type FastingConfig,
  type FastingMode,
  IF_PRESETS,
  perReminderMl,
  windowMinutes,
} from '@/features/fasting/window';
import { formatTime, KEYS as ONBOARDING_KEYS, parseTime } from '@/features/onboarding/onboarding';
import { usePremium } from '@/features/premium/use-premium';
import { intervalLabel, toMinutes } from '@/features/reminders/plan';
import { getReminderSettings, syncReminders } from '@/features/reminders/reminders';
import { formatVolume, type VolumeUnit } from '@/lib/units';
import { useTheme } from '@/theme';

type Picking = 'start' | 'end' | null;
const fmtDur = (min: number) => `${Math.floor(min / 60)}h ${String(min % 60).padStart(2, '0')}m`;

export default function FastingScreen() {
  const { colors, typography, spacing } = useTheme();
  const premium = usePremium();
  const db = getDb();
  const [cfg, setCfg] = useState<FastingConfig>(() => getFastingConfig(db));
  const [picking, setPicking] = useState<Picking>(null);
  const [open, setOpen] = useState<'city' | 'method' | null>(null);
  const [locMsg, setLocMsg] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const patch = (p: Partial<FastingConfig>) => {
    setSaved(null);
    setCfg((c) => ({ ...c, ...p }));
  };
  const unit: VolumeUnit = getSetting(db, ONBOARDING_KEYS.volumeUnit) === 'oz' ? 'oz' : 'ml';
  const interval = getReminderSettings(db).intervalMin;
  const goal = getGoalMl(db);
  const mode = effectiveMode(cfg, premium);
  const win = useMemo(
    () => eatingWindow({ ...cfg, enabled: true }, premium, new Date()),
    [cfg, premium],
  );

  const choose = (m: FastingMode) => {
    if (m !== 'manual' && !premium) return router.push('/paywall');
    patch({ mode: m });
  };

  const onPicked = (e: DateTimePickerEvent, date?: Date) => {
    const which = picking;
    setPicking(null);
    if (e.type === 'set' && date && which)
      patch({ [which]: formatTime(date.getHours(), date.getMinutes()) });
  };

  const locateMe = async () => {
    setLocMsg('Finding your approximate location…');
    const { granted } = await Location.requestForegroundPermissionsAsync();
    if (!granted) {
      setLocMsg('Location is off. Pick your city from the list instead.');
      setOpen('city');
      return;
    }
    try {
      const pos =
        (await Location.getLastKnownPositionAsync()) ??
        (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Lowest }));
      // Two decimals (~1 km) is plenty for prayer times; nothing leaves the phone.
      const r = (n: number) => Math.round(n * 100) / 100;
      patch({
        place: { label: 'My location', lat: r(pos.coords.latitude), lng: r(pos.coords.longitude) },
      });
      setLocMsg(null);
    } catch {
      setLocMsg("Couldn't get your location. Pick your city from the list instead.");
      setOpen('city');
    }
  };

  const save = async () => {
    setFastingConfig(db, cfg);
    const n = await syncReminders();
    setSaved(
      cfg.enabled
        ? `Saved. ${n} reminders scheduled.`
        : `Saved. Fasting mode is off; ${n} normal reminders scheduled.`,
    );
  };

  const card = (children: ReactNode, selected = false) => (
    <View
      style={[
        styles.card,
        {
          backgroundColor: selected ? colors.secondaryContainer : colors.surfaceContainerLowest,
          borderColor: selected ? colors.primaryContainer : 'transparent',
          padding: spacing.md,
          gap: spacing.sm,
        },
      ]}
    >
      {children}
    </View>
  );
  const badge = (text: string, locked: boolean) => (
    <View style={[styles.badge, { backgroundColor: colors.surfaceContainerHigh }]}>
      {locked ? (
        <MaterialCommunityIcons name="lock-outline" size={12} color={colors.onSurfaceVariant} />
      ) : null}
      <Text style={[typography.labelMd, { color: colors.onSurfaceVariant }]}>{text}</Text>
    </View>
  );
  const pattern = (
    m: FastingMode,
    title: string,
    desc: string,
    icon: string,
    extra?: ReactNode,
  ) => {
    const on = mode === m;
    const locked = m !== 'manual' && !premium;
    return (
      <Pressable
        key={m}
        accessibilityRole="radio"
        accessibilityState={{ selected: on }}
        accessibilityLabel={`${title}${locked ? ', Premium' : ''}`}
        onPress={() => choose(m)}
      >
        {card(
          <>
            <View style={styles.rowBetween}>
              <MaterialCommunityIcons name={icon as never} size={22} color={colors.primary} />
              <Text style={[typography.headlineSm, { color: colors.onSurface, flex: 1 }]}>
                {title}
              </Text>
              {badge(m === 'manual' ? 'Free' : 'Premium', locked)}
            </View>
            <Text style={[typography.bodySm, { color: colors.onSurfaceVariant }]}>{desc}</Text>
            {extra}
          </>,
          on,
        )}
      </Pressable>
    );
  };
  const chip = (label: string, on: boolean, onPress: () => void) => (
    <Pressable
      key={label}
      accessibilityRole="radio"
      accessibilityState={{ selected: on }}
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: on ? colors.primary : colors.surfaceContainerHigh,
        },
      ]}
    >
      <Text style={[typography.labelLg, { color: on ? colors.onPrimary : colors.onSurface }]}>
        {label}
      </Text>
    </Pressable>
  );
  const row = (
    icon: string,
    caption: string,
    value: string,
    onPress?: () => void,
    right?: ReactNode,
  ) => (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${caption}: ${value}`}
      disabled={!onPress}
      onPress={onPress}
      style={styles.row}
    >
      <MaterialCommunityIcons name={icon as never} size={20} color={colors.onSurfaceVariant} />
      <View style={{ flex: 1 }}>
        <Text style={[typography.labelMd, { color: colors.onSurfaceVariant }]}>{caption}</Text>
        <Text style={[typography.labelLg, { color: colors.onSurface }]}>{value}</Text>
      </View>
      {right ??
        (onPress ? (
          <MaterialCommunityIcons name="chevron-right" size={22} color={colors.outline} />
        ) : null)}
    </Pressable>
  );

  // 24h bar: eating segment(s) on a 0–24 track.
  const s = win ? toMinutes(win.start) / 1440 : 0;
  const len = win ? windowMinutes(win) / 1440 : 0;
  const segs: [number, number][] =
    s + len > 1
      ? [
          [s, 1],
          [0, s + len - 1],
        ]
      : [[s, s + len]];
  const perMl = win ? perReminderMl(goal, win, interval) : 0;
  const pickVal = picking ? parseTime(cfg[picking]) : null;

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Fasting mode' }} />
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={{
          padding: spacing.margin,
          gap: spacing.md,
          paddingBottom: spacing.xl,
        }}
      >
        {card(
          <>
            <View style={styles.rowBetween}>
              <View style={{ flex: 1 }}>
                <Text style={[typography.headlineSm, { color: colors.onSurface }]}>
                  Fasting mode
                </Text>
                <Text
                  style={[
                    typography.labelMd,
                    { color: cfg.enabled ? colors.primary : colors.outline },
                  ]}
                >
                  {cfg.enabled ? 'On' : 'Off'}
                </Text>
              </View>
              <Switch
                accessibilityLabel="Fasting mode"
                value={cfg.enabled}
                onValueChange={(v) => patch({ enabled: v })}
                trackColor={{ true: colors.primaryContainer, false: colors.outlineVariant }}
                thumbColor={cfg.enabled ? colors.primary : colors.surfaceContainerHigh}
              />
            </View>
            <Text style={[typography.bodyMd, { color: colors.onSurfaceVariant }]}>
              I&apos;ll only remind you during your eating window. Rest easy while you fast.
            </Text>
          </>,
        )}

        <Text
          style={[
            typography.labelMd,
            { color: colors.onSurfaceVariant, textTransform: 'uppercase' },
          ]}
        >
          Choose schedule pattern
        </Text>
        <View accessibilityRole="radiogroup" style={{ gap: spacing.md }}>
          {pattern(
            'manual',
            'Manual window',
            'Set your own eating hours.',
            'clock-outline',
            mode === 'manual' ? (
              <View style={{ gap: 4 }}>
                {row('silverware-fork-knife', 'Eating starts', cfg.start, () =>
                  setPicking('start'),
                )}
                {row('moon-waning-crescent', 'Eating ends', cfg.end, () => setPicking('end'))}
              </View>
            ) : null,
          )}
          {pattern(
            'if',
            'Intermittent fasting',
            'Popular fasting ratios. Water is spread across your eating hours.',
            'circle-half-full',
            <>
              <View style={styles.chips}>
                {IF_PRESETS.map((p) =>
                  chip(p, mode === 'if' && cfg.preset === p, () => {
                    if (!premium) return router.push('/paywall');
                    patch({ mode: 'if', preset: p });
                  }),
                )}
              </View>
              {mode === 'if'
                ? row('silverware-fork-knife', 'Eating starts', cfg.start, () =>
                    setPicking('start'),
                  )
                : null}
            </>,
          )}
          {pattern(
            'ramadan',
            'Ramadan',
            'Eating window from Maghrib to Fajr, calculated on your phone from prayer times.',
            'weather-night',
          )}
        </View>

        {premium && cfg.mode === 'ramadan'
          ? card(
              <>
                <Text style={[typography.headlineSm, { color: colors.onSurface }]}>
                  Ramadan preferences
                </Text>
                {row('map-marker-outline', 'Location', cfg.place?.label ?? 'Not set', () =>
                  setOpen(open === 'city' ? null : 'city'),
                )}
                {open === 'city' ? (
                  <View style={{ gap: 4 }}>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => void locateMe()}
                      style={styles.row}
                    >
                      <MaterialCommunityIcons
                        name="crosshairs-gps"
                        size={20}
                        color={colors.primary}
                      />
                      <Text style={[typography.labelLg, { color: colors.primary }]}>
                        Use my approximate location
                      </Text>
                    </Pressable>
                    {CITIES.map((c) => (
                      <Pressable
                        key={c.label}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: cfg.place?.label === c.label }}
                        onPress={() => {
                          patch({ place: c });
                          setLocMsg(null);
                          setOpen(null);
                        }}
                        style={styles.row}
                      >
                        <Text style={[typography.bodyMd, { color: colors.onSurface }]}>
                          {c.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
                {locMsg ? (
                  <Text style={[typography.bodySm, { color: colors.onSurfaceVariant }]}>
                    {locMsg}
                  </Text>
                ) : null}
                {row(
                  'calculator-variant-outline',
                  'Prayer calculation',
                  CALC_METHODS[cfg.method],
                  () => setOpen(open === 'method' ? null : 'method'),
                )}
                {open === 'method' ? (
                  <View style={{ gap: 4 }}>
                    {(Object.keys(CALC_METHODS) as CalcMethod[]).map((m) => (
                      <Pressable
                        key={m}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: cfg.method === m }}
                        onPress={() => {
                          patch({ method: m });
                          setOpen(null);
                        }}
                        style={styles.row}
                      >
                        <Text
                          style={[
                            typography.bodyMd,
                            { color: cfg.method === m ? colors.primary : colors.onSurface },
                          ]}
                        >
                          {CALC_METHODS[m]}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
                {row(
                  'bell-ring-outline',
                  'Suhoor plan',
                  '2 glasses before Fajr (30 and 15 min before)',
                  undefined,
                  <Switch
                    accessibilityLabel="Suhoor plan"
                    value={cfg.suhoorPlan}
                    onValueChange={(v) => patch({ suhoorPlan: v })}
                    trackColor={{ true: colors.primaryContainer, false: colors.outlineVariant }}
                    thumbColor={cfg.suhoorPlan ? colors.primary : colors.surfaceContainerHigh}
                  />,
                )}
              </>,
            )
          : null}

        {win
          ? card(
              <>
                <Text style={[typography.headlineSm, { color: colors.onSurface }]}>24h cycle</Text>
                <View style={styles.rowBetween}>
                  <Text style={[typography.labelMd, { color: colors.primary }]}>
                    Eating ({fmtDur(windowMinutes(win))})
                  </Text>
                  <Text style={[typography.labelMd, { color: colors.onSurfaceVariant }]}>
                    Fasting ({fmtDur(1440 - windowMinutes(win))})
                  </Text>
                </View>
                <View style={[styles.track, { backgroundColor: colors.surfaceContainerHigh }]}>
                  {segs.map(([a, b], i) => (
                    <View
                      key={i}
                      style={[
                        styles.seg,
                        {
                          left: `${a * 100}%`,
                          width: `${(b - a) * 100}%`,
                          backgroundColor: colors.primaryContainer,
                        },
                      ]}
                    />
                  ))}
                </View>
                <View style={styles.rowBetween}>
                  {['00:00', '06:00', '12:00', '18:00', '24:00'].map((t) => (
                    <Text key={t} style={[typography.labelMd, { color: colors.outline }]}>
                      {t}
                    </Text>
                  ))}
                </View>
                <Text style={[typography.headlineSm, { color: colors.onSurface }]}>
                  {win.start} → {win.end}
                </Text>
                <Text style={[typography.bodyMd, { color: colors.onSurfaceVariant }]}>
                  Drink {formatVolume(goal, unit)} between {win.start} and {win.end}, about{' '}
                  {formatVolume(perMl, unit)} every {intervalLabel(interval)}.
                </Text>
              </>,
            )
          : null}

        <Button label="Save fasting schedule" onPress={() => void save()} />
        {saved ? (
          <Text
            accessibilityLiveRegion="polite"
            style={[typography.bodySm, { color: colors.primary, textAlign: 'center' }]}
          >
            {saved}
          </Text>
        ) : null}
        <Text style={[typography.bodySm, { color: colors.outline, textAlign: 'center' }]}>
          Reminders pause outside the eating window.
        </Text>
      </ScrollView>
      {pickVal ? (
        <DateTimePicker
          mode="time"
          value={new Date(2000, 0, 1, pickVal.h, pickVal.m)}
          onChange={onPicked}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 24, borderWidth: 2 },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  chips: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: { minHeight: 40, paddingHorizontal: 14, borderRadius: 20, justifyContent: 'center' },
  track: { height: 14, borderRadius: 7, overflow: 'hidden' },
  seg: { position: 'absolute', top: 0, bottom: 0 },
});
