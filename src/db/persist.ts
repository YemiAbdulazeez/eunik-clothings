import { toast } from "sonner";
import { createSeed } from "./seed";
import { SEED_VERSION, STORAGE_KEY, type DbState } from "./types";

/** Live API mode — local demo DB must not persist or accept writes. */
export const API_MODE = Boolean(import.meta.env.VITE_API_URL);
const PROD_BUILD = import.meta.env.PROD;

let state: DbState = createSeed();
const listeners = new Set<() => void>();
let quotaWarned = false;

function notify(): void {
  listeners.forEach((listener) => listener());
}

export function save(): void {
  // 2.4 — never persist the offline house file in production or when API is connected
  if (API_MODE || PROD_BUILD) {
    notify();
    return;
  }
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
  // 2.2 — fail closed: no silent local writes while API is on
  if (API_MODE) {
    throw new Error(
      "This action is not wired to the live API yet (or must not use the offline house file). Retry after the house connects the endpoint.",
    );
  }
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
  if (API_MODE) {
    throw new Error("Cannot reset the offline house file while the live API is connected.");
  }
  state = next;
  save();
}

export function bootStore(): void {
  // Production / API: in-memory seed only (no password-bearing localStorage restore)
  if (API_MODE || PROD_BUILD) {
    state = createSeed();
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    return;
  }
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
