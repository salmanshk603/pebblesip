import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Device from 'expo-device';
import { Stack } from 'expo-router';
import { Linking, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { BRAND_GUIDES, guideFor } from '@/features/reminders/battery-guide';
import { useTheme } from '@/theme';

/** Opens the system battery-optimisation list. No special permission needed. */
async function openBatterySettings() {
  try {
    await Linking.sendIntent('android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS');
  } catch {
    await Linking.openSettings();
  }
}

export default function BatteryHelpScreen() {
  const { colors, typography, spacing } = useTheme();
  const mine = guideFor(Device.manufacturer);
  const others = BRAND_GUIDES.filter((g) => g.id !== mine.id);

  const card = (g: (typeof BRAND_GUIDES)[number], highlight: boolean) => (
    <View
      key={g.id}
      style={[
        styles.card,
        {
          backgroundColor: highlight ? colors.secondaryContainer : colors.surfaceContainerLowest,
          padding: spacing.md,
          gap: spacing.sm,
        },
      ]}
    >
      <Text style={[typography.headlineSm, { color: colors.onSurface }]}>
        {g.name}
        {highlight ? ' (this phone)' : ''}
      </Text>
      {g.steps.map((s, i) => (
        <Text key={i} style={[typography.bodyMd, { color: colors.onSurfaceVariant }]}>
          {i + 1}. {s}
        </Text>
      ))}
    </View>
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Reminders not arriving?',
          headerStyle: { backgroundColor: colors.background },
        }}
      />
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={{ padding: spacing.margin, gap: spacing.md, paddingBottom: 48 }}
      >
        <View style={[styles.row, { gap: spacing.sm }]}>
          <MaterialCommunityIcons name="battery-heart-variant" size={28} color={colors.primary} />
          <Text style={[typography.bodyMd, { color: colors.onSurfaceVariant, flex: 1 }]}>
            Some phones stop apps in the background to save battery, which can delay or block
            reminders. These steps let Pebblesip remind you on time.
          </Text>
        </View>
        {card(mine, true)}
        {Platform.OS === 'android' ? (
          <Button label="Open battery settings" onPress={() => void openBatterySettings()} />
        ) : null}
        <Text
          style={[
            typography.labelMd,
            { color: colors.onSurfaceVariant, textTransform: 'uppercase' },
          ]}
        >
          Other phones
        </Text>
        {others.map((g) => card(g, false))}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 24 },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
});
