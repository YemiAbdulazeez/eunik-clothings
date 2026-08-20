/**
 * Analytics tracking — uses sendBeacon to POST /v1/events when VITE_API_URL is set.
 * Falls back to in-memory localStorage store (demo) when API is not configured.
 * eunik_vid visitor cookie is set only after the user accepts cookies.
 */
import { db } from "@/db/database";

const API_BASE = import.meta.env.VITE_API_URL as string | undefined;

// ─── Visitor / session IDs ────────────────────────────────────────────────────

function cookiesAllowed(): boolean {
  return localStorage.getItem("eunik-cookies") === "1";
}

function getOrCreateVid(): string | null {
  if (!cookiesAllowed()) return null;
  let vid = localStorage.getItem("eunik_vid");
  if (!vid) {
    vid = `v_${crypto.randomUUID().replace(/-/g, "")}`;
    localStorage.setItem("eunik_vid", vid);
  }
  return vid;
}

// Session id: one per tab, reset on new tab
let _sid: string | null = null;
function getSessionId(): string {
  if (!_sid) _sid = `s_${crypto.randomUUID().replace(/-/g, "")}`;
  return _sid;
}

// ─── Channel + UTM ────────────────────────────────────────────────────────────

function channelFromLocation(): string {
  const params = new URLSearchParams(window.location.search);
  const utm = params.get("utm_source");
  if (utm) return utm;
  const ref = document.referrer;
  if (!ref) return "direct";
  if (ref.includes("instagram") || ref.includes("facebook") || ref.includes("twitter") || ref.includes("tiktok")) return "social";
  if (ref.includes("google") || ref.includes("bing") || ref.includes("yahoo")) return "organic";
  if (ref.includes("wa.me") || ref.includes("whatsapp")) return "whatsapp";
  return "referral";
}

function utmParams() {
  const p = new URLSearchParams(window.location.search);
  return {
    utmSource: p.get("utm_source") ?? undefined,
    utmMedium: p.get("utm_medium") ?? undefined,
    utmCampaign: p.get("utm_campaign") ?? undefined,
  };
}

function referrerHost(): string | undefined {
  try {
    return document.referrer ? new URL(document.referrer).hostname : undefined;
  } catch {
    return undefined;
  }
}

// ─── Core send ────────────────────────────────────────────────────────────────

function sendToApi(payload: Record<string, unknown>): void {
  if (!API_BASE) return;
  const url = `${API_BASE}/events`;
  const body = JSON.stringify(payload);
  // sendBeacon is fire-and-forget; never throws in UI
  if (navigator.sendBeacon) {
    navigator.sendBeacon(url, body);
  } else {
    fetch(url, { method: "POST", body, headers: { "Content-Type": "application/json" } }).catch(() => {});
  }
}

// ─── Internal track ───────────────────────────────────────────────────────────

function fireEvent(
  name: string,
  extra: { path?: string; sku?: string; queryText?: string; title?: string } = {},
): void {
  const path = extra.path ?? window.location.pathname;
  const device: "mobile" | "desktop" | "tablet" = window.innerWidth < 768 ? "mobile" : "desktop";
  const channel = channelFromLocation();
  const vid = getOrCreateVid();
  const sid = getSessionId();
  const { utmSource, utmMedium, utmCampaign } = utmParams();

  if (API_BASE) {
    // Real backend: sendBeacon
    sendToApi({
      name, path, device, channel,
      referrerHost: referrerHost(),
      vid, sid,
      utmSource, utmMedium, utmCampaign,
      sku: extra.sku,
      queryText: extra.queryText,
      title: extra.title ?? document.title,
    });
  } else {
    // Demo: write to localStorage analytics store
    void db.analytics.track(name, { path, device, channel, referrer: document.referrer, sku: extra.sku });
  }
}

// ─── Public helpers ───────────────────────────────────────────────────────────

export function trackPageView(path: string): void {
  if (path.startsWith("/studio") || path.startsWith("/atelier")) return;
  fireEvent("page_view", { path, title: document.title });
}

export function trackEvent(
  type: string,
  payload?: { path?: string; sku?: string; queryText?: string },
): void {
  fireEvent(type, payload);
}
