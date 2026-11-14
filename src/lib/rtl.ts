import { I18nManager } from 'react-native';

/** "Go forward" chevron that points the right way in RTL locales (Arabic, Urdu). */
export const CHEVRON_FORWARD = I18nManager.isRTL ? 'chevron-left' : 'chevron-right';
