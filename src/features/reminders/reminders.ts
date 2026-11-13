import {
  AndroidImportance,
  cancelAllScheduledNotificationsAsync,
  dismissNotificationAsync,
  getPermissionsAsync,
  scheduleNotificationAsync,
  SchedulableTriggerInputTypes,
  setNotificationCategoryAsync,
  setNotificationChannelAsync,
  type NotificationResponse,
} from 'expo-notifications';
import { Platform } from 'react-native';

import { addLog, getDb, getSetting, getToday, setSetting } from '@/db';
import type { DB } from '@/db/types';
import { KEYS as ONBOARDING_KEYS } from '@/features/onboarding/onboarding';
import { emitDataChanged } from '@/lib/data-events';
import { FEATURE_FLAGS } from '@/lib/feature-flags';
import { formatVolume, type VolumeUnit } from '@/lib/units';

import { DEFAULT_INTERVAL, planReminders, REMINDER_INTERVALS, type ReminderInterval } from './plan';

export const REMINDER_CHANNEL_ID = 'reminders';
export const REMINDER_CATEGORY = 'reminder';
export const ACTION_LOG = 'log250';
export const ACTION_SNOOZE = 'snooze15';
export const ACTION_AMOUNT_ML = 250;
const SNOOZE_MIN = 15;

export const REMINDER_KEYS = {
  enabled: 'reminders_enabled',
  interval: 'reminder_interval',
  handled: 'reminder_handled_ids',
} as const;

const MESSAGES = [
  'Time for a gentle sip.',
  'Pip says: a few sips now?',
  'Little sips, every day.',
  'A glass of water is waiting for you.',
  'Quick sip break?',
];

export interface ReminderSettings {
  enabled: boolean;
  intervalMin: ReminderInterval;
}

export function getReminderSettings(db: DB): ReminderSettings {
  const raw = Number(getSetting(db, REMINDER_KEYS.interval));
  const intervalMin = (REMINDER_INTERVALS as readonly number[]).includes(raw)
    ? (raw as ReminderInterval)
    : DEFAULT_INTERVAL;
  return { enabled: getSetting(db, REMINDER_KEYS.enabled) !== '0', intervalMin };
}

export function setReminderSettings(db: DB, s: Partial<ReminderSettings>): void {
  if (s.enabled !== undefined) setSetting(db, REMINDER_KEYS.enabled, s.enabled ? '1' : '0');
  if (s.intervalMin !== undefined) setSetting(db, REMINDER_KEYS.interval, String(s.intervalMin));
}

/** Channel + action buttons. Safe to call repeatedly. */
export async function ensureReminderChannel(unit: VolumeUnit = 'ml', premiumExtras = false) {
  if (Platform.OS === 'android') {
    await setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
      name: 'Water reminders',
      importance: AndroidImportance.DEFAULT,
    });
  }
  const actions = [
    {
      identifier: ACTION_LOG,
      buttonTitle: `+${formatVolume(ACTION_AMOUNT_ML, unit)}`,
      options: { opensAppToForeground: false },
    },
  ];
  if (premiumExtras) {
    actions.push({
      identifier: ACTION_SNOOZE,
      buttonTitle: `Snooze ${SNOOZE_MIN} min`,
      options: { opensAppToForeground: false },
    });
  }
  await setNotificationCategoryAsync(REMINDER_CATEGORY, actions);
}

function content(i: number) {
  return {
    title: 'Pebblesip',
    body: MESSAGES[i % MESSAGES.length]!,
    categoryIdentifier: REMINDER_CATEGORY,
  };
}

let syncing: Promise<number> | null = null;
let again = false;

/**
 * Cancels and re-creates every reminder from the current settings and today's progress.
 * Coalesces overlapping calls. Returns how many were scheduled.
 */
export function syncReminders(premium = false): Promise<number> {
  if (syncing) {
    again = true;
    return syncing;
  }
  syncing = (async () => {
    let n = 0;
    do {
      again = false;
      n = await doSync(premium);
    } while (again);
    return n;
  })().finally(() => {
    syncing = null;
  });
  return syncing;
}

async function doSync(premium: boolean): Promise<number> {
  const db = getDb();
  await cancelAllScheduledNotificationsAsync();
  if (getSetting(db, ONBOARDING_KEYS.complete) !== '1') return 0;
  const settings = getReminderSettings(db);
  if (!settings.enabled) return 0;
  const { granted } = await getPermissionsAsync();
  if (!granted) return 0;

  const extras = FEATURE_FLAGS.premiumReminders && premium;
  const unit: VolumeUnit = getSetting(db, ONBOARDING_KEYS.volumeUnit) === 'oz' ? 'oz' : 'ml';
  await ensureReminderChannel(unit, extras);

  const now = Date.now();
  const today = getToday(db, now);
  const times = planReminders({
    now,
    wakeTime: getSetting(db, ONBOARDING_KEYS.wakeTime) ?? '07:00',
    sleepTime: getSetting(db, ONBOARDING_KEYS.sleepTime) ?? '23:00',
    intervalMin: settings.intervalMin,
    goalMetToday: today.met,
    ...(extras ? { smartPacing: true, progressToday: today.totalMl / today.goalMl } : {}),
  });
  for (const [i, ts] of times.entries()) {
    await scheduleNotificationAsync({
      content: content(i),
      trigger: {
        type: SchedulableTriggerInputTypes.DATE,
        date: ts,
        ...(Platform.OS === 'android' ? { channelId: REMINDER_CHANNEL_ID } : {}),
      },
    });
  }
  return times.length;
}

/** Remembers handled responses so a press is never logged twice (background + later listener). */
function alreadyHandled(db: DB, key: string): boolean {
  let ids: string[] = [];
  try {
    ids = JSON.parse(getSetting(db, REMINDER_KEYS.handled) ?? '[]') as string[];
  } catch {
    ids = [];
  }
  if (ids.includes(key)) return true;
  setSetting(db, REMINDER_KEYS.handled, JSON.stringify([...ids, key].slice(-30)));
  return false;
}

/** Handles a reminder action from the foreground listener or the background task. */
export async function handleReminderAction(
  response: NotificationResponse,
  premium = false,
): Promise<void> {
  const action = response.actionIdentifier;
  if (action !== ACTION_LOG && action !== ACTION_SNOOZE) return;
  const id = response.notification.request.identifier;
  const db = getDb();
  if (alreadyHandled(db, `${id}:${action}`)) return;

  if (action === ACTION_LOG) {
    addLog(db, { amountMl: ACTION_AMOUNT_ML });
    emitDataChanged();
  } else {
    await scheduleNotificationAsync({
      content: content(0),
      trigger: { type: SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: SNOOZE_MIN * 60 },
    });
  }
  await dismissNotificationAsync(id).catch(() => undefined);
  if (action === ACTION_LOG) await syncReminders(premium);
}

/** Dev-only helper to check the notification and its action without waiting. */
export async function sendTestReminder(seconds = 5): Promise<void> {
  const db = getDb();
  const unit: VolumeUnit = getSetting(db, ONBOARDING_KEYS.volumeUnit) === 'oz' ? 'oz' : 'ml';
  await ensureReminderChannel(unit);
  await scheduleNotificationAsync({
    content: content(1),
    trigger: {
      type: SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
      ...(Platform.OS === 'android' ? { channelId: REMINDER_CHANNEL_ID } : {}),
    },
  });
}
