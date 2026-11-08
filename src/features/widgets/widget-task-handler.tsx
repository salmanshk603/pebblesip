import type { WidgetTaskHandlerProps } from 'react-native-android-widget';

import { HelloWidget } from './hello-widget';

export async function widgetTaskHandler({
  widgetInfo,
  widgetAction,
  renderWidget,
}: WidgetTaskHandlerProps) {
  if (widgetInfo.widgetName !== 'Hello') return;
  switch (widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED':
      renderWidget(<HelloWidget />);
      break;
    default:
      break;
  }
}
