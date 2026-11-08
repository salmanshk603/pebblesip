/** Short sortable-ish unique id; no native dependency needed. */
export function newId(now: number = Date.now()): string {
  return `${now.toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
