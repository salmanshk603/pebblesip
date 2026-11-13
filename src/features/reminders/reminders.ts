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
import { getFastingConfig } from '@/features/fasting/fasting';
import { eatingWindow, perReminderMl, suhoorTimes } from '@/features/fasting/window';
import { KEYS as ONBOARDING_KEYS } from '@/features/onboarding/onboarding';
import { isPremium } from '@/features/premium/use-premium';
import { emitDataChanged } from '@/lib/data-events';
import { FEATURE_FLAGS } from '@/lib/feature-flags';
import { formatVolume, type VolumeUnit } from '@/lib/units';

import {
  DAYS_AHEAD,
  DEFAULT_INTERVAL,
  planReminders,
  REMINDER_INTERVALS,
  type ReminderInterval,
} from './plan';

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

function content(i: number, sipHint?: string) {
  const msg = MESSAGES[i % MESSAGES.length]!;
  return {
    title: 'Pebblesip',
    body: sipHint ? `${msg} About ${sipHint} now.` : msg,
    categoryIdentifier: REMINDER_CATEGORY,
  };
}

function suhoorContent(n: 1 | 2) {
  return {
    title: 'Suhoor sip',
    body: `Glass ${n} of 2 before Fajr.`,
    categoryIdentifier: REMINDER_CATEGORY,
  };
}

/** Set by the widgets module so a notification log refreshes widgets without an import cycle. */
let onLogged: (() => void) | undefined;
export function setOnReminderLogged(fn: () => void): void {
  onLogged = fn;
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

async function doSync(premiumArg: boolean): Promise<number> {
  const db = getDb();
  const premium = premiumArg || isPremium();
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
  // Fasting mode swaps the wake–sleep day for the eating window (may cross midnight).
  const fasting = getFastingConfig(db);
  const eatWin = eatingWindow(fasting, premium, new Date(now));
  const sipHint = eatWin
    ? formatVolume(perReminderMl(today.goalMl, eatWin, settings.intervalMin), unit)
    : undefined;
  const times = planReminders({
    now,
    wakeTime: eatWin?.start ?? getSetting(db, ONBOARDING_KEYS.wakeTime) ?? '07:00',
    sleepTime: eatWin?.end ?? getSetting(db, ONBOARDING_KEYS.sleepTime) ?? '23:00',
    intervalMin: settings.intervalMin,
    goalMetToday: today.met,
    ...(extras ? { smartPacing: true, progressToday: today.totalMl / today.goalMl } : {}),
  });
  for (const [i, ts] of times.entries()) {
    await scheduleNotificationAsync({
      content: content(i, sipHint),
      trigger: {
        type: SchedulableTriggerInputTypes.DATE,
        date: ts,
        ...(Platform.OS === 'android' ? { channelId: REMINDER_CHANNEL_ID } : {}),
      },
    });
  }
  // Premium Suhoor plan: two pre-dawn reminders before each Fajr (Ramadan mode only).
  let suhoor: number[] = [];
  if (eatWin && premium && fasting.mode === 'ramadan' && fasting.suhoorPlan && fasting.place) {
    suhoor = suhoorTimes(fasting.place, fasting.method, now, DAYS_AHEAD);
    for (const [i, ts] of suhoor.entries()) {
      await scheduleNotificationAsync({
        content: suhoorContent(((i % 2) + 1) as 1 | 2),
        trigger: {
          type: SchedulableTriggerInputTypes.DATE,
          date: ts,
          ...(Platform.OS === 'android' ? { channelId: REMINDER_CHANNEL_ID } : {}),
        },
      });
    }
  }
  return times.length + suhoor.length;
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
    onLogged?.();
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
