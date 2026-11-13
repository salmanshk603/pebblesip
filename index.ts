import 'expo-router/entry';
import '@/features/reminders/background-task';
import { registerWidgetTaskHandler } from 'react-native-android-widget';

import { widgetTaskHandler } from '@/features/widgets/widget-task-handler';

registerWidgetTaskHandler(widgetTaskHandler);
