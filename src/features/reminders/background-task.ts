import {
  registerTaskAsync,
  setNotificationHandler,
  type NotificationResponse,
} from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';

import { handleReminderAction } from './reminders';

/** Runs for reminder action buttons pressed while the app is backgrounded or killed (Android). */
export const REMINDER_ACTION_TASK = 'pebblesip-reminder-action';

TaskManager.defineTask(REMINDER_ACTION_TASK, async ({ data, error }) => {
  if (error || !data) return;
  const payload = data as Partial<NotificationResponse>;
  if (typeof payload.actionIdentifier === 'string' && payload.notification) {
    await handleReminderAction(payload as NotificationResponse);
  }
});

void registerTaskAsync(REMINDER_ACTION_TASK).catch(() => undefined);

// Show reminders as banners even while the app is open.
setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});
