/**
 * Minimal analytics + crash reporting facade (PRD §9). Phase 10 ships it unwired: events are
 * logged in dev builds and dropped in release until Firebase / Sentry are connected
 * (see docs/analytics-setup.md). Call sites never change when the backends are added.
 * Never send personal or health data: only the event name and small, non-identifying props.
 */
export type AnalyticsEvent =
  | 'onboarding_completed'
  | 'water_logged'
  | 'goal_met'
  | 'widget_added'
  | 'fasting_enabled'
  | 'paywall_shown'
  | 'purchase_completed'
  | 'reminder_tapped';

export type EventProps = Record<string, string | number | boolean>;

type Sink = (event: AnalyticsEvent, props?: EventProps) => void;
type CrashSink = (error: unknown) => void;

let sink: Sink | null = null;
let crashSink: CrashSink | null = null;

/** Connect a backend (e.g. Firebase Analytics) once it exists. */
export function setAnalyticsSink(s: Sink | null): void {
  sink = s;
}

/** Connect a crash reporter (e.g. Sentry.captureException) once it exists. */
export function setCrashSink(s: CrashSink | null): void {
  crashSink = s;
}

export function track(event: AnalyticsEvent, props?: EventProps): void {
  try {
    if (sink) sink(event, props);
    else if (__DEV__) console.log(`[analytics] ${event}`, props ?? '');
  } catch {
    // Analytics must never break the app.
  }
}

export function reportError(error: unknown): void {
  try {
    crashSink?.(error);
  } catch {
    // ignore
  }
}
