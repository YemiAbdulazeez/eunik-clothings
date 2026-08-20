import { toast } from "sonner";
import { createSeed } from "./seed";
import { SEED_VERSION, STORAGE_KEY, type DbState } from "./types";

let state: DbState = createSeed();
const listeners = new Set<() => void>();
let quotaWarned = false;

function notify(): void {
  listeners.forEach((listener) => listener());
}

export function save(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    quotaWarned = false;
    notify();
  } catch (error) {
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      if (!quotaWarned) {
        quotaWarned = true;
        toast.error("House file is full — drop a receipt or reset the demo.");
      }
      return;
    }
    throw error;
  }
}

export function getState(): DbState {
  return state;
}

export function mutate(recipe: (draft: DbState) => void): DbState {
  const next = structuredClone(state);
  recipe(next);
  state = next;
  save();
  return state;
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function replaceState(next: DbState): void {
  state = next;
  save();
}

export function bootStore(): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      state = createSeed();
      save();
      return;
    }
    const parsed = JSON.parse(raw) as DbState;
    if (!parsed?.meta || parsed.meta.version !== SEED_VERSION) {
      state = createSeed();
      save();
      return;
    }
    state = parsed;
  } catch {
    state = createSeed();
    save();
  }
}

bootStore();
