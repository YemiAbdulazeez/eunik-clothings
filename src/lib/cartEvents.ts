/** Notify UI when HTTP cart mutations succeed (local persist.subscribe does not fire in API mode). */
const listeners = new Set<() => void>();

export function onCartChange(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function emitCartChange(): void {
  listeners.forEach((listener) => listener());
}
