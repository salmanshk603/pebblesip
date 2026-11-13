type Listener = () => void;
const listeners = new Set<Listener>();

/** Tell open screens that logs changed outside them (notification action, later widgets). */
export function emitDataChanged(): void {
  listeners.forEach((l) => l());
}

export function onDataChanged(l: Listener): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}
