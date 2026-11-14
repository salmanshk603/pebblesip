import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { requestPinWidget, WidgetPreview } from 'react-native-android-widget';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { getDb } from '@/db';
import { showRewardedAd } from '@/features/ads/theme-trial';
import { usePremium } from '@/features/premium/use-premium';
import {
  ACCENT_COLORS,
  resolveTheme,
  WIDGET_THEME_IDS,
  WIDGET_THEMES,
  type WidgetThemeId,
} from '@/features/widgets/themes';
import {
  MEDIUM_WIDGET,
  MediumWaterWidget,
  SMALL_WIDGET,
  SmallWaterWidget,
} from '@/features/widgets/water-widgets';
import {
  getThemeTrial,
  getWidgetData,
  getWidgetPrefs,
  startThemeTrial,
  setWidgetPrefs,
  type WidgetData,
  type WidgetPrefs,
} from '@/features/widgets/widget-data';
import { refreshWidgets } from '@/features/widgets/widget-task-handler';
import { useTheme } from '@/theme';

const STEPS = [
  'Touch and hold an empty spot on your home screen.',
  'Tap Widgets, then find Pebblesip.',
  'Drag the small or wide widget onto your home screen.',
];

export default function WidgetsScreen() {
  const { colors, typography, spacing } = useTheme();
  const premium = usePremium();
  const { width } = useWindowDimensions();
  const [prefs, setPrefs] = useState<WidgetPrefs>(() => getWidgetPrefs(getDb()));
  const [data, setData] = useState<WidgetData>(() => getWidgetData(getDb(), premium));
  const [showSteps, setShowSteps] = useState(false);
  const [pinMsg, setPinMsg] = useState<string | null>(null);
  // State, not a render-time read: the React Compiler would memoize a bare call.
  const [trialTheme, setTrialTheme] = useState(() => getThemeTrial(getDb())?.theme ?? null);

  useFocusEffect(
    useCallback(() => {
      setData(getWidgetData(getDb(), premium));
      setTrialTheme(getThemeTrial(getDb())?.theme ?? null);
    }, [premium]),
  );

  const save = (p: WidgetPrefs) => {
    setWidgetPrefs(getDb(), p);
    setPrefs(p);
    setData(getWidgetData(getDb(), premium));
    void refreshWidgets();
  };
  const tryWithAd = async (id: WidgetThemeId) => {
    const r = await showRewardedAd();
    if (r === 'earned') {
      startThemeTrial(getDb(), id);
      setTrialTheme(id);
      save({ ...prefs, theme: id });
    } else if (r === 'unavailable') {
      Alert.alert(
        'No ad available',
        'Please try again later, or get Premium to unlock every theme.',
      );
    }
  };
  const pickTheme = (id: WidgetThemeId) => {
    if (WIDGET_THEMES[id].premium && !premium && trialTheme !== id) {
      // Free users: Premium, or watch one rewarded ad to try this theme for 24 h.
      return Alert.alert(WIDGET_THEMES[id].name, 'This is a Premium theme.', [
        { text: 'Not now', style: 'cancel' },
        { text: 'Try 24h (watch ad)', onPress: () => void tryWithAd(id) },
        { text: 'Get Premium', onPress: () => router.push('/paywall') },
      ]);
    }
    save({ ...prefs, theme: id });
  };
  const pickAccent = (c: string | null) => {
    if (!premium) return router.push('/paywall');
    save({ ...prefs, accent: prefs.accent === c ? null : c });
  };
  const pin = async (name: string) => {
    const ok = await requestPinWidget({ widgetName: name }).catch(() => false);
    if (!ok) {
      setPinMsg("Your launcher can't add widgets from here. Follow the steps below.");
      setShowSteps(true);
    } else setPinMsg(null);
  };

  const cardW = (width - spacing.margin * 2 - spacing.md) / 2;
  const previewW = Math.round(cardW - 24);
  const active = data.theme;

  return (
    <SafeAreaView edges={['top']} style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ padding: spacing.margin, gap: spacing.md }}>
        <Text
          accessibilityRole="header"
          style={[typography.headlineLg, { color: colors.onSurface }]}
        >
          Make your home screen yours
        </Text>
        <Text style={[typography.bodyMd, { color: colors.onSurfaceVariant }]}>
          Log water right from your home screen, without opening the app.
        </Text>

        <View
          style={[
            styles.card,
            { backgroundColor: colors.surfaceContainer, padding: spacing.md, gap: spacing.sm },
          ]}
        >
          <Text style={[typography.headlineSm, { color: colors.onSurface }]}>
            How to add a widget
          </Text>
          {/* Decorative preview: not tappable, hidden from screen readers. */}
          <View
            style={{ alignItems: 'center' }}
            pointerEvents="none"
            importantForAccessibility="no-hide-descendants"
            accessibilityElementsHidden
          >
            <WidgetPreview
              renderWidget={() => <MediumWaterWidget d={{ ...data, theme: active }} />}
              width={Math.min(320, width - spacing.margin * 2 - 32)}
              height={130}
            />
          </View>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Button label="Add small" onPress={() => void pin(SMALL_WIDGET)} />
            </View>
            <View style={{ flex: 1 }}>
              <Button label="Add wide" onPress={() => void pin(MEDIUM_WIDGET)} />
            </View>
          </View>
          {pinMsg ? (
            <Text style={[typography.bodySm, { color: colors.onSurfaceVariant }]}>{pinMsg}</Text>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: showSteps }}
            onPress={() => setShowSteps((s) => !s)}
            style={styles.row}
          >
            <Text style={[typography.labelLg, { color: colors.primary }]}>
              {showSteps ? 'Hide steps' : 'Show me how'}
            </Text>
            <MaterialCommunityIcons
              name={showSteps ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={colors.primary}
            />
          </Pressable>
          {showSteps
            ? STEPS.map((s, i) => (
                <Text key={i} style={[typography.bodyMd, { color: colors.onSurfaceVariant }]}>
                  {i + 1}. {s}
                </Text>
              ))
            : null}
        </View>

        <View style={styles.rowBetween}>
          <Text style={[typography.headlineSm, { color: colors.onSurface }]}>Widget themes</Text>
          <Text style={[typography.labelMd, { color: colors.onSurfaceVariant }]}>
            {WIDGET_THEME_IDS.length} styles
          </Text>
        </View>
        <View style={styles.grid} accessibilityRole="radiogroup">
          {WIDGET_THEME_IDS.map((id) => {
            const t = WIDGET_THEMES[id];
            const unlocked = !t.premium || premium || trialTheme === id;
            const on = prefs.theme === id && unlocked;
            const locked = !unlocked;
            return (
              <Pressable
                key={id}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                accessibilityLabel={`${t.name}${locked ? ', Premium' : ''}`}
                onPress={() => pickTheme(id)}
                style={[
                  styles.themeCard,
                  {
                    width: cardW,
                    // Glass is translucent: show it over a tinted card, as on a wallpaper.
                    backgroundColor: id === 'glass' ? '#BFD9EE' : colors.surfaceContainerLowest,
                    borderColor: on ? colors.primaryContainer : 'transparent',
                  },
                ]}
              >
                <View
                  pointerEvents="none"
                  importantForAccessibility="no-hide-descendants"
                  accessibilityElementsHidden
                >
                  <WidgetPreview
                    renderWidget={() => (
                      <SmallWaterWidget
                        d={{
                          ...data,
                          theme: resolveTheme(id, premium ? prefs.accent : null, true),
                        }}
                      />
                    )}
                    width={previewW}
                    height={previewW}
                  />
                </View>
                <View style={styles.rowBetween}>
                  <Text style={[typography.labelLg, { color: colors.onSurface, flex: 1 }]}>
                    {t.name}
                    {!premium && trialTheme === id ? ' · 24h trial' : ''}
                  </Text>
                  {on ? (
                    <MaterialCommunityIcons name="check-circle" size={20} color={colors.primary} />
                  ) : locked ? (
                    <MaterialCommunityIcons name="lock-outline" size={18} color={colors.outline} />
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>

        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surfaceContainerLowest,
              padding: spacing.md,
              gap: spacing.sm,
            },
          ]}
        >
          <View style={styles.rowBetween}>
            <Text style={[typography.headlineSm, { color: colors.onSurface }]}>
              Custom accent colour
            </Text>
            {!premium ? (
              <MaterialCommunityIcons name="lock-outline" size={18} color={colors.outline} />
            ) : null}
          </View>
          <Text style={[typography.bodySm, { color: colors.onSurfaceVariant }]}>
            Match the progress bar and buttons to your wallpaper.
          </Text>
          <View style={styles.row} accessibilityRole="radiogroup">
            {ACCENT_COLORS.map((c) => {
              const on = premium && prefs.accent === c;
              return (
                <Pressable
                  key={c}
                  accessibilityRole="radio"
                  accessibilityLabel={`Accent ${c}${premium ? '' : ', Premium'}`}
                  accessibilityState={{ selected: on }}
                  onPress={() => pickAccent(c)}
                  style={[
                    styles.swatch,
                    { backgroundColor: c, borderColor: on ? colors.onSurface : 'transparent' },
                  ]}
                >
                  {!premium ? (
                    <MaterialCommunityIcons name="lock-outline" size={16} color="#FFFFFF" />
                  ) : on ? (
                    <MaterialCommunityIcons name="check" size={18} color="#FFFFFF" />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  card: { borderRadius: 24 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 48, flexWrap: 'wrap' },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  themeCard: { borderRadius: 24, borderWidth: 2, padding: 10, gap: 8 },
  swatch: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
