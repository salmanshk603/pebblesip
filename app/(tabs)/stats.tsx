import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Pip } from '@/components/pip';
import { Segmented } from '@/components/segmented';
import { getDb, getFirstDate, getMetDates, getRange, getSetting, getStreak } from '@/db';
import { KEYS as ONBOARDING_KEYS } from '@/features/onboarding/onboarding';
import { usePremium } from '@/features/premium/use-premium';
import {
  type Bar,
  bestStreak,
  changePct,
  dayBars,
  heatLevel,
  monthBars,
  monthGrid,
  summarize,
} from '@/features/stats/stats';
import { StatsBanner } from '@/features/ads/stats-banner';
import { GrowBar } from '@/features/stats/grow-bar';
import { exportCsv } from '@/features/stats/export-csv';
import { onDataChanged } from '@/lib/data-events';
import { addDays, fromDateKey, todayKey } from '@/lib/dates';
import { formatVolume, type VolumeUnit } from '@/lib/units';
import { useTheme } from '@/theme';

const PERIODS = ['Week', 'Month', 'Year'] as const;
type Period = (typeof PERIODS)[number];
const CHART_H = 160;
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function load(now = Date.now()) {
  const db = getDb();
  const today = todayKey(now);
  return {
    today,
    unit: (getSetting(db, ONBOARDING_KEYS.volumeUnit) === 'oz' ? 'oz' : 'ml') as VolumeUnit,
    streak: getStreak(db, now),
    best: bestStreak(getMetDates(db)),
    week: getRange(db, addDays(today, -6), today),
    prevWeek: getRange(db, addDays(today, -13), addDays(today, -7)),
    month: getRange(db, addDays(today, -29), today),
    prevMonth: getRange(db, addDays(today, -59), addDays(today, -30)),
    year: getRange(db, addDays(today, -365), today),
    cal: getRange(db, `${today.slice(0, 8)}01`, today),
  };
}

export default function StatsScreen() {
  const { colors, typography, spacing } = useTheme();
  const premium = usePremium();
  const [chosen, setPeriod] = useState<Period>('Week');
  // Month/Year are Premium; losing Premium falls back to Week.
  const period: Period = premium ? chosen : 'Week';
  const [data, setData] = useState(load);
  const [csvMsg, setCsvMsg] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      setData(load());
      return onDataChanged(() => setData(load()));
    }, []),
  );

  const pick = (p: Period) => {
    if (p !== 'Week' && !premium) return router.push('/paywall');
    setPeriod(p);
  };

  const { bars, rows, prev } = useMemo(() => {
    if (period === 'Month')
      return {
        bars: dayBars(data.month, data.today, 'date'),
        rows: data.month,
        prev: data.prevMonth,
      };
    if (period === 'Year')
      return { bars: monthBars(data.year, data.today), rows: data.year, prev: [] };
    return {
      bars: dayBars(data.week, data.today, 'weekday'),
      rows: data.week,
      prev: data.prevWeek,
    };
  }, [period, data]);
  // Year averages only count days since the first log, not empty days before install.
  const summary = useMemo(() => {
    if (period !== 'Year') return summarize(rows);
    const first = getFirstDate(getDb());
    return summarize(first ? rows.filter((r) => r.date >= first) : []);
  }, [period, rows]);
  const change = period === 'Year' ? null : changePct(rows, prev);
  const goal = data.week[data.week.length - 1]?.goalMl ?? 0;
  const max = Math.max(goal, ...bars.map((b) => Math.max(b.totalMl, b.goalMl)), 1);

  const onExport = async () => {
    if (!premium) return router.push('/paywall');
    const r = await exportCsv();
    setCsvMsg(
      r === 'empty'
        ? 'Nothing logged yet.'
        : r === 'error'
          ? "Couldn't export right now. Please try again."
          : null,
    );
  };

  const card = {
    backgroundColor: colors.surfaceContainerLowest,
    padding: spacing.md,
    gap: spacing.sm,
  };
  const t = fromDateKey(data.today);
  const grid = monthGrid(t.getFullYear(), t.getMonth());
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < grid.length; i += 7) {
    const w = grid.slice(i, i + 7);
    weeks.push([...w, ...Array.from({ length: 7 - w.length }, () => null)]);
  }
  const monthByDate = new Map(data.cal.map((r) => [r.date, r]));
  const heatColor = {
    met: colors.primaryContainer,
    mid: colors.secondaryContainer,
    low: colors.surfaceContainerHigh,
    empty: colors.surfaceContainerLow,
    future: 'transparent',
  } as const;

  const chartBar = (b: Bar, index: number) => {
    const h = Math.round((b.totalMl / max) * CHART_H);
    const showLabel = period !== 'Month' || b.isCurrent || Number(b.label) % 5 === 0;
    return (
      <View
        key={b.key}
        style={styles.barCol}
        accessible
        accessibilityLabel={`${b.label}: ${formatVolume(b.totalMl, data.unit)}${b.met ? ', goal met' : ''}`}
      >
        <View
          style={{
            height: CHART_H,
            justifyContent: 'flex-end',
            width: '100%',
            alignItems: 'center',
          }}
        >
          {b.met && period === 'Week' ? (
            <MaterialCommunityIcons name="check" size={14} color={colors.primary} />
          ) : null}
          <GrowBar
            index={index}
            playKey={period}
            height={Math.max(h, b.totalMl > 0 ? 4 : 2)}
            style={{
              width: period === 'Month' ? '70%' : '64%',
              borderRadius: 8,
              backgroundColor: b.met
                ? colors.primaryContainer
                : b.totalMl > 0
                  ? colors.secondaryContainer
                  : colors.surfaceContainerHigh,
              borderWidth: b.isCurrent ? 2 : 0,
              borderColor: colors.primary,
            }}
          />
        </View>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
          style={[
            typography.labelMd,
            {
              color: b.isCurrent ? colors.primary : colors.onSurfaceVariant,
              fontSize: period === 'Week' ? 12 : 10,
            },
          ]}
        >
          {showLabel ? b.label : ' '}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView edges={['top']} style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ padding: spacing.margin, gap: spacing.md }}>
        <Text
          accessibilityRole="header"
          style={[typography.headlineLg, { color: colors.onSurface }]}
        >
          Stats
        </Text>

        <View style={[styles.card, card, styles.row]}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={[typography.headlineSm, { color: colors.onSurface }]}>
              🔥 {data.streak}-day streak
            </Text>
            <Text style={[typography.labelMd, { color: colors.onSurfaceVariant }]}>
              Best: {data.best} {data.best === 1 ? 'day' : 'days'}
            </Text>
            <Text style={[typography.bodySm, { color: colors.onSurfaceVariant }]}>
              {data.streak > 0
                ? 'Pip is thriving. Keep the gentle rhythm going.'
                : 'Meet today’s goal to start a new streak.'}
            </Text>
          </View>
          <Pip size={64} eyesClosed={data.streak === 0} />
        </View>

        <Segmented
          options={PERIODS}
          value={period}
          onChange={pick}
          accessibilityLabel="Chart period"
        />
        {!premium ? (
          <Text style={[typography.bodySm, { color: colors.outline }]}>
            Month and Year views are part of Premium.
          </Text>
        ) : null}

        <View style={[styles.card, card]}>
          <View style={styles.rowBetween}>
            <Text style={[typography.headlineSm, { color: colors.onSurface }]}>
              {period === 'Week'
                ? 'Last 7 days'
                : period === 'Month'
                  ? 'Last 30 days'
                  : 'Last 12 months'}
            </Text>
            <Text style={[typography.labelMd, { color: colors.primary }]}>
              Goal: {formatVolume(goal, data.unit)}
            </Text>
          </View>
          {period === 'Year' ? (
            <Text style={[typography.bodySm, { color: colors.onSurfaceVariant }]}>
              Average per day, each month
            </Text>
          ) : null}
          <View style={styles.chart}>
            <View
              pointerEvents="none"
              style={[
                styles.goalLine,
                { bottom: 20 + Math.round((goal / max) * CHART_H), borderColor: colors.outline },
              ]}
            />
            {bars.map(chartBar)}
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.card, card, { flex: 1 }]}>
            <Text style={[typography.labelMd, { color: colors.onSurfaceVariant }]}>
              Daily average
            </Text>
            <Text style={[typography.headlineSm, { color: colors.onSurface }]}>
              {formatVolume(summary.avgMl, data.unit)}
            </Text>
            {change !== null ? (
              <Text style={[typography.bodySm, { color: colors.primary }]}>
                {change >= 0 ? '+' : ''}
                {change}% vs previous {period === 'Week' ? 'week' : '30 days'}
              </Text>
            ) : null}
          </View>
          <View style={[styles.card, card, { flex: 1 }]}>
            <Text style={[typography.labelMd, { color: colors.onSurfaceVariant }]}>Goals met</Text>
            <Text style={[typography.headlineSm, { color: colors.onSurface }]}>
              {summary.met}/{summary.days}
            </Text>
            <Text style={[typography.bodySm, { color: colors.primary }]}>
              {summary.successRate}% success rate
            </Text>
          </View>
        </View>

        <View style={[styles.card, card]}>
          <View style={styles.rowBetween}>
            <Text style={[typography.headlineSm, { color: colors.onSurface }]}>
              {MONTH_NAMES[t.getMonth()]} {t.getFullYear()}
            </Text>
            {!premium ? (
              <MaterialCommunityIcons name="lock-outline" size={18} color={colors.outline} />
            ) : null}
          </View>
          <View style={styles.week}>
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
              <View key={`h${i}`} style={styles.headCell}>
                <Text style={[typography.labelMd, { color: colors.outline }]}>{d}</Text>
              </View>
            ))}
          </View>
          {weeks.map((week, w) => (
            <View key={`w${w}`} style={styles.week}>
              {week.map((date, i) => {
                if (!date) return <View key={`e${i}`} style={styles.cell} />;
                const level = premium
                  ? heatLevel(monthByDate.get(date), date, data.today)
                  : 'empty';
                return (
                  <View
                    key={date}
                    style={styles.cell}
                    accessible
                    accessibilityLabel={`${Number(date.slice(8))}: ${premium ? level : 'locked'}`}
                  >
                    <View
                      style={[
                        styles.dot,
                        {
                          backgroundColor: heatColor[level],
                          borderColor: date === data.today ? colors.primary : colors.outlineVariant,
                          borderWidth: date === data.today || level === 'future' ? 1.5 : 0,
                          opacity: premium ? 1 : 0.5,
                        },
                      ]}
                    >
                      <Text style={[typography.labelMd, { color: colors.onSurface }]}>
                        {Number(date.slice(8))}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ))}
          {!premium ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/paywall')}
              style={styles.link}
            >
              <Text style={[typography.bodySm, { color: colors.onSurfaceVariant, flex: 1 }]}>
                See your monthly rhythm with Pebblesip Premium.
              </Text>
              <Text style={[typography.labelLg, { color: colors.primary }]}>Explore</Text>
            </Pressable>
          ) : null}
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Export CSV${premium ? '' : ', Premium'}`}
          onPress={() => void onExport()}
          style={[styles.card, card, styles.link]}
        >
          <MaterialCommunityIcons name="file-delimited-outline" size={22} color={colors.primary} />
          <Text style={[typography.labelLg, { color: colors.onSurface, flex: 1 }]}>
            Export data (CSV)
          </Text>
          <MaterialCommunityIcons
            name={premium ? 'share-variant-outline' : 'lock-outline'}
            size={20}
            color={colors.outline}
          />
        </Pressable>
        {csvMsg ? <Text style={[typography.bodySm, { color: colors.error }]}>{csvMsg}</Text> : null}
        <StatsBanner />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  card: { borderRadius: 24 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  chart: { flexDirection: 'row', alignItems: 'flex-end', paddingTop: 8 },
  barCol: { flex: 1, alignItems: 'center', gap: 4 },
  goalLine: { position: 'absolute', left: 0, right: 0, borderTopWidth: 1, borderStyle: 'dashed' },
  week: { flexDirection: 'row' },
  headCell: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  cell: { flex: 1, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  dot: {
    width: '86%',
    aspectRatio: 1,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  link: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48 },
});
