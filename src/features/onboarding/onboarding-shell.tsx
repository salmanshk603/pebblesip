import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';

export const TOTAL_STEPS = 4;

type Props = {
  /** 1-based step for the dots; omit on the goal/permission screens. */
  step?: number;
  onSkip?: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  footer: ReactNode;
};

export function OnboardingShell({ step, onSkip, title, subtitle, children, footer }: Props) {
  const { colors, typography, spacing } = useTheme();
  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: colors.background }]}
      edges={['top', 'bottom']}
    >
      <View style={[styles.header, { paddingHorizontal: spacing.margin }]}>
        <View
          style={styles.dots}
          accessibilityLabel={step ? `Step ${step} of ${TOTAL_STEPS}` : undefined}
        >
          {step
            ? Array.from({ length: TOTAL_STEPS }, (_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    {
                      width: i + 1 === step ? 28 : 8,
                      backgroundColor:
                        i + 1 <= step ? colors.primaryContainer : colors.outlineVariant,
                    },
                  ]}
                />
              ))
            : null}
        </View>
        {onSkip ? (
          <Pressable accessibilityRole="button" onPress={onSkip} hitSlop={12} style={styles.skip}>
            <Text style={[typography.labelLg, { color: colors.onSurfaceVariant }]}>Skip</Text>
          </Pressable>
        ) : null}
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.margin, gap: spacing.lg, flexGrow: 1 }}>
        {title ? (
          <View style={{ gap: spacing.xs }}>
            {step ? (
              <Text
                style={[typography.labelMd, { color: colors.primary, textTransform: 'uppercase' }]}
              >
                Step {step} of {TOTAL_STEPS}
              </Text>
            ) : null}
            <Text
              accessibilityRole="header"
              style={[typography.headlineLg, { color: colors.onSurface }]}
            >
              {title}
            </Text>
            {subtitle ? (
              <Text style={[typography.bodyMd, { color: colors.onSurfaceVariant }]}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        ) : null}
        {children}
      </ScrollView>
      <View style={{ padding: spacing.margin, gap: spacing.sm }}>{footer}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dots: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  dot: { height: 8, borderRadius: 4 },
  skip: { minHeight: 48, justifyContent: 'center' },
});
