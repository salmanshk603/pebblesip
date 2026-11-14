import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { AnimatedPip } from '@/features/hydration/animated-pip';
import {
  buy,
  loadPlans,
  type Plan,
  type PlanId,
  purchasesAvailable,
  restore,
} from '@/features/premium/purchases';
import { usePremium } from '@/features/premium/use-premium';
import { track } from '@/lib/analytics';
import { useTheme } from '@/theme';

const FEATURES = [
  'All aesthetic widget themes',
  'Ramadan & intermittent fasting modes',
  'Full stats, calendar & export',
  'No ads, ever',
];

/** Shown when the store isn't reachable or RevenueCat isn't set up: PRD USD prices, not buyable. */
const FALLBACK: Record<PlanId, { price: string; trial: string | null }> = {
  yearly: { price: '$9.99', trial: '3-day free trial' },
  monthly: { price: '$1.99', trial: null },
  lifetime: { price: '$14.99', trial: null },
};
const LABEL: Record<PlanId, { title: string; sub: string; per: string }> = {
  yearly: { title: 'Yearly', sub: 'Best value', per: '/year' },
  monthly: { title: 'Monthly', sub: 'Flexible, cancel anytime', per: '/month' },
  lifetime: { title: 'Lifetime', sub: 'One-time payment', per: 'one-time' },
};

export default function PaywallScreen() {
  const { colors, typography, spacing } = useTheme();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const premium = usePremium();
  const [plans, setPlans] = useState<Plan[] | null>(purchasesAvailable() ? null : []);
  const [picked, setPicked] = useState<PlanId>('yearly');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    track('paywall_shown', { from: from ?? 'feature' });
  }, [from]);

  useEffect(() => {
    if (!purchasesAvailable()) return;
    loadPlans()
      .then(setPlans)
      .catch(() => {
        setPlans([]);
        setMsg("Couldn't reach Google Play. Check your connection and try again.");
      });
  }, []);

  const close = () => {
    if (from === 'onboarding' || !router.canGoBack()) router.replace('/');
    else router.back();
  };

  const live = (plans?.length ?? 0) > 0;
  const plan = plans?.find((p) => p.id === picked);
  const ids: PlanId[] = live ? plans!.map((p) => p.id) : ['yearly', 'monthly', 'lifetime'];
  const trial = live ? (plan?.trial ?? null) : null;

  const purchase = async () => {
    if (!plan) return;
    setBusy(true);
    setMsg(null);
    const r = await buy(plan);
    setBusy(false);
    if (r === 'success') {
      track('purchase_completed', { plan: plan.id });
      close();
    } else if (r === 'error') setMsg('The purchase didn’t go through. You haven’t been charged.');
  };

  const doRestore = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const ok = await restore();
      setMsg(
        ok
          ? 'Premium restored. Welcome back!'
          : 'No previous purchase found for this Google account.',
      );
    } catch {
      setMsg("Couldn't restore right now. Please try again.");
    }
    setBusy(false);
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false, presentation: 'modal' }} />
      <ScrollView contentContainerStyle={{ padding: spacing.margin, gap: spacing.md }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={close}
          hitSlop={12}
          style={[styles.close, { backgroundColor: colors.surfaceContainerLowest }]}
        >
          <MaterialCommunityIcons name="close" size={22} color={colors.onSurfaceVariant} />
        </Pressable>

        <View style={{ alignItems: 'center', gap: spacing.sm }}>
          <AnimatedPip size={96} active sipKey={0} progress={1} />
          <Text
            accessibilityRole="header"
            style={[typography.headlineLg, { color: colors.onSurface, textAlign: 'center' }]}
          >
            Pebblesip Premium
          </Text>
          <Text style={[typography.bodyMd, { color: colors.onSurfaceVariant }]}>
            More calm, more cute, no ads.
          </Text>
        </View>

        {premium ? (
          <View
            style={[
              styles.card,
              { backgroundColor: colors.secondaryContainer, padding: spacing.md },
            ]}
          >
            <Text
              style={[
                typography.labelLg,
                { color: colors.onSecondaryContainer, textAlign: 'center' },
              ]}
            >
              You have Premium. Thank you for supporting Pebblesip!
            </Text>
          </View>
        ) : null}

        <View
          style={[
            styles.card,
            { backgroundColor: colors.surfaceContainerLowest, padding: spacing.md, gap: 12 },
          ]}
        >
          {FEATURES.map((f) => (
            <View key={f} style={styles.row}>
              <View style={[styles.tick, { backgroundColor: colors.secondaryContainer }]}>
                <MaterialCommunityIcons name="check" size={16} color={colors.primary} />
              </View>
              <Text style={[typography.bodyMd, { color: colors.onSurface }]}>{f}</Text>
            </View>
          ))}
        </View>

        {plans === null ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <View accessibilityRole="radiogroup" style={{ gap: 12 }}>
            {ids.map((id) => {
              const p = plans.find((x) => x.id === id);
              const on = picked === id;
              const price = p?.price ?? FALLBACK[id].price;
              const sub = p ? (p.trial ?? LABEL[id].sub) : (FALLBACK[id].trial ?? LABEL[id].sub);
              return (
                <Pressable
                  key={id}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={`${LABEL[id].title}, ${price} ${LABEL[id].per}`}
                  onPress={() => setPicked(id)}
                  style={[
                    styles.card,
                    styles.plan,
                    {
                      backgroundColor: on
                        ? colors.secondaryContainer
                        : colors.surfaceContainerLowest,
                      borderColor: on ? colors.primaryContainer : colors.outlineVariant,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={on ? 'radiobox-marked' : 'radiobox-blank'}
                    size={22}
                    color={on ? colors.primary : colors.outline}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.labelLg, { color: colors.onSurface }]}>
                      {LABEL[id].title}
                    </Text>
                    <Text
                      style={[
                        typography.bodySm,
                        { color: id === 'yearly' ? colors.primary : colors.onSurfaceVariant },
                      ]}
                    >
                      {sub}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[typography.labelLg, { color: colors.onSurface }]}>{price}</Text>
                    <Text style={[typography.bodySm, { color: colors.outline }]}>
                      {LABEL[id].per}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {!live && plans !== null ? (
          <Text
            style={[typography.bodySm, { color: colors.onSurfaceVariant, textAlign: 'center' }]}
          >
            {purchasesAvailable()
              ? 'Prices will show once Google Play is reachable.'
              : 'Purchases aren’t set up in this build yet.'}
          </Text>
        ) : null}

        <Button
          label={busy ? 'Please wait…' : trial ? 'Start free trial' : 'Continue'}
          disabled={!live || busy || premium}
          onPress={() => void purchase()}
        />
        <Text style={[typography.bodySm, { color: colors.outline, textAlign: 'center' }]}>
          {picked === 'lifetime' ? 'One payment. Yours forever.' : 'Cancel anytime in Google Play.'}
        </Text>
        {msg ? (
          <Text
            accessibilityLiveRegion="polite"
            style={[typography.bodySm, { color: colors.primary, textAlign: 'center' }]}
          >
            {msg}
          </Text>
        ) : null}
        <Pressable
          accessibilityRole="button"
          disabled={busy || !purchasesAvailable()}
          onPress={() => void doRestore()}
          style={{ alignSelf: 'center', minHeight: 48, justifyContent: 'center' }}
        >
          <Text
            style={[
              typography.labelLg,
              { color: purchasesAvailable() ? colors.primary : colors.outline },
            ]}
          >
            Restore purchases
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  card: { borderRadius: 24 },
  close: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tick: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  plan: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderWidth: 2 },
});
