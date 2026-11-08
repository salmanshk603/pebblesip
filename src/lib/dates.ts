/**
 * Day keys are local calendar dates ("YYYY-MM-DD") in the device's current timezone.
 * A log's `date` is fixed when it is written, so a later timezone change never moves
 * past entries to another day; "today" is always computed from the current local time.
 */
export type DateKey = string;

const pad = (n: number) => String(n).padStart(2, '0');

export function toDateKey(ts: number | Date): DateKey {
  const d = typeof ts === 'number' ? new Date(ts) : ts;
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayKey(now: number = Date.now()): DateKey {
  return toDateKey(now);
}

/** Parses a key as local midnight of that day. */
export function fromDateKey(key: DateKey): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

/** Calendar arithmetic (DST-safe: works on dates, not on 24h multiples). */
export function addDays(key: DateKey, days: number): DateKey {
  const d = fromDateKey(key);
  d.setDate(d.getDate() + days);
  return toDateKey(d);
}

/** Inclusive list of keys from `from` to `to`. Empty if from > to. */
export function dateRange(from: DateKey, to: DateKey): DateKey[] {
  const out: DateKey[] = [];
  for (let k = from; k <= to; k = addDays(k, 1)) out.push(k);
  return out;
}

/** Epoch ms of the next local midnight after `now` (for midnight refreshes). */
export function nextMidnight(now: number = Date.now()): number {
  return fromDateKey(addDays(toDateKey(now), 1)).getTime();
}
