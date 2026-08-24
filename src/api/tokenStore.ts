/**
 * Cross-origin auth tokens for Safari / iOS.
 * httpOnly cookies from a different API host are often blocked; Bearer works.
 */
const ACCESS_KEY = "eunik_access";
const REFRESH_KEY = "eunik_refresh";

let memoryAccess: string | null = null;

function storage(remember: boolean): Storage {
  return remember ? localStorage : sessionStorage;
}

export function getAccessToken(): string | null {
  if (memoryAccess) return memoryAccess;
  try {
    return sessionStorage.getItem(ACCESS_KEY) ?? localStorage.getItem(ACCESS_KEY);
  } catch {
    return null;
  }
}

export function getRefreshToken(): string | null {
  try {
    return sessionStorage.getItem(REFRESH_KEY) ?? localStorage.getItem(REFRESH_KEY);
  } catch {
    return null;
  }
}

export function setAuthTokens(
  tokens: { access?: string; refresh?: string } | null | undefined,
  opts: { remember?: boolean } = {},
): void {
  const remember = Boolean(opts.remember);
  const access = tokens?.access ?? null;
  const refresh = tokens?.refresh ?? null;
  memoryAccess = access;

  try {
    // Clear both stores so we don't leave stale copies
    sessionStorage.removeItem(ACCESS_KEY);
    sessionStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);

    if (!access && !refresh) return;

    const store = storage(remember);
    if (access) store.setItem(ACCESS_KEY, access);
    if (refresh) store.setItem(REFRESH_KEY, refresh);
  } catch {
    /* private mode / quota */
  }
}

export function clearAuthTokens(): void {
  memoryAccess = null;
  try {
    sessionStorage.removeItem(ACCESS_KEY);
    sessionStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  } catch {
    /* ignore */
  }
}
