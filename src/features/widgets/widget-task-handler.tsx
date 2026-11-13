'use no memo';

import { requestWidgetUpdate, type WidgetTaskHandlerProps } from 'react-native-android-widget';

import { addLog, getDb } from '@/db';
import { isPremium } from '@/features/premium/use-premium';
import { setOnReminderLogged, syncReminders } from '@/features/reminders/reminders';
import { emitDataChanged } from '@/lib/data-events';

import {
  LOG_ACTION,
  MEDIUM_WIDGET,
  MediumWaterWidget,
  SMALL_WIDGET,
  SmallWaterWidget,
} from './water-widgets';
import { getWidgetData } from './widget-data';

function render(name: string) {
  const d = getWidgetData(getDb(), isPremium());
  return name === MEDIUM_WIDGET ? <MediumWaterWidget d={d} /> : <SmallWaterWidget d={d} />;
}

/** Re-draws every placed widget from SQLite. Call after any log change or prefs change. */
export async function refreshWidgets(): Promise<void> {
  for (const widgetName of [SMALL_WIDGET, MEDIUM_WIDGET]) {
    await requestWidgetUpdate({ widgetName, renderWidget: () => render(widgetName) }).catch(
      () => undefined,
    );
  }
}

// A "+250 ml" notification action also redraws the widgets.
setOnReminderLogged(() => void refreshWidgets());

export async function widgetTaskHandler({
  widgetInfo,
  widgetAction,
  clickAction,
  clickActionData,
  renderWidget,
}: WidgetTaskHandlerProps) {
  const name = widgetInfo.widgetName;
  if (name !== SMALL_WIDGET && name !== MEDIUM_WIDGET) return;
  switch (widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED':
      renderWidget(render(name));
      break;
    case 'WIDGET_CLICK': {
      if (clickAction !== LOG_ACTION) break;
      const ml = Number(clickActionData?.ml);
      if (!Number.isFinite(ml) || ml <= 0) break;
      addLog(getDb(), { amountMl: ml });
      renderWidget(render(name));
      emitDataChanged();
      // Other placed widgets and reminders (goal may now be met) follow.
      await refreshWidgets();
      await syncReminders();
      break;
    }
    default:
      break;
  }
}
