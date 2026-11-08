import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { Pip } from '@/components/pip';
import { useDraft } from '@/features/onboarding/draft-context';
import { formatTime, parseTime, to12h } from '@/features/onboarding/onboarding';
import { OnboardingShell } from '@/features/onboarding/onboarding-shell';
import { useTheme } from '@/theme';

type Which = 'wakeTime' | 'sleepTime';

export default function DayScreen() {
  const { colors, typography, spacing } = useTheme();
  const { draft, update } = useDraft();
  const [editing, setEditing] = useState<Which | null>(null);
  const next = () => router.push('/units');
  const same = draft.wakeTime === draft.sleepTime;

  const onPicked = (e: DateTimePickerEvent, date?: Date) => {
    const which = editing;
    setEditing(null);
    if (e.type === 'set' && date && which)
      update({ [which]: formatTime(date.getHours(), date.getMinutes()) });
  };

  const card = (
    which: Which,
    title: string,
    hint: string,
    icon: 'white-balance-sunny' | 'moon-waning-crescent',
    tint: string,
  ) => {
    const t = to12h(draft[which]);
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${title}, ${t.time} ${t.period}. Tap to change.`}
        onPress={() => setEditing(which)}
        style={[
          styles.card,
          { backgroundColor: colors.surfaceContainerLowest, padding: spacing.md },
        ]}
      >
        <View style={[styles.icon, { backgroundColor: tint }]}>
          <MaterialCommunityIcons name={icon} size={28} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={[
              typography.labelMd,
              { color: colors.onSurfaceVariant, textTransform: 'uppercase' },
            ]}
          >
            {title}
          </Text>
          <Text style={[typography.headlineLg, { color: colors.onSurface }]}>
            {t.time}{' '}
            <Text style={[typography.labelLg, { color: colors.onSurfaceVariant }]}>{t.period}</Text>
          </Text>
          <Text style={[typography.bodySm, { color: colors.primary }]}>{hint}</Text>
        </View>
        <View style={[styles.edit, { backgroundColor: colors.surfaceContainer }]}>
          <MaterialCommunityIcons name="pencil" size={18} color={colors.onSurface} />
        </View>
      </Pressable>
    );
  };

  const editingTime = editing ? parseTime(draft[editing]) : null;
  return (
    <OnboardingShell
      step={3}
      onSkip={next}
      title="Your day"
      subtitle="Set your waking rhythm for gentle, mindful reminders."
      footer={<Button label="Continue" onPress={next} disabled={same} />}
    >
      {card(
        'wakeTime',
        'Wake-up time',
        'First gentle sip of the day',
        'white-balance-sunny',
        colors.surfaceContainerLow,
      )}
      {card(
        'sleepTime',
        'Bedtime',
        'Reminders automatically pause',
        'moon-waning-crescent',
        colors.surfaceContainer,
      )}
      {same ? (
        <Text style={[typography.bodySm, { color: colors.error }]}>
          Wake-up time and bedtime can&apos;t be the same.
        </Text>
      ) : null}
      <View
        style={[styles.note, { backgroundColor: colors.secondaryContainer, padding: spacing.md }]}
      >
        <Pip size={40} />
        <Text style={[typography.bodyMd, { color: colors.onSecondaryContainer, flex: 1 }]}>
          &quot;I&apos;ll only remind you while you&apos;re awake.&quot;
        </Text>
      </View>
      {editingTime ? (
        <DateTimePicker
          mode="time"
          value={new Date(2000, 0, 1, editingTime.h, editingTime.m)}
          onChange={onPicked}
        />
      ) : null}
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 24, flexDirection: 'row', alignItems: 'center', gap: 16 },
  icon: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  edit: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  note: {
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 'auto',
  },
});
