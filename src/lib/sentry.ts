import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

import { setCrashSink } from './analytics';

/**
 * Crash reporting (Sentry, EU region). Release builds only, and only when a DSN is configured
 * (SENTRY_DSN in .env.local / EAS env). Sends crashes and errors, never logged health data:
 * no PII, no breadcrumbs from console, no session replay, no performance tracing.
 */
export function initSentry(): void {
  const dsn = Constants.expoConfig?.extra?.sentryDsn as string | null | undefined;
  if (__DEV__ || !dsn) return;
  Sentry.init({
    dsn,
    sendDefaultPii: false,
    tracesSampleRate: 0,
    enableAutoSessionTracking: true,
    attachScreenshot: false,
    attachViewHierarchy: false,
    beforeBreadcrumb: (b) => (b.category === 'console' ? null : b),
  });
  setCrashSink((e) => Sentry.captureException(e));
  // One-off check that events arrive: build once with EXPO_PUBLIC_SENTRY_TEST=1.
  if (process.env.EXPO_PUBLIC_SENTRY_TEST === '1')
    Sentry.captureMessage('Pebblesip Sentry test event');
}

export { Sentry };
