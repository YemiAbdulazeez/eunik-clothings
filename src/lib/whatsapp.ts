import { SITE_URL, WHATSAPP_PHONE } from "@/data/catalog";
import { db, ForbiddenError, type Product } from "@/db/database";
import { toast } from "sonner";

/** Absolute image URL for WhatsApp — Cloudinary/CDN links must not be prefixed with the site origin. */
export function absoluteMediaUrl(src: string | undefined | null): string {
  const value = String(src ?? "").trim();
  if (!value) return SITE_URL;
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("//")) return `https:${value}`;
  const base = SITE_URL.replace(/\/$/, "");
  return `${base}${value.startsWith("/") ? value : `/${value}`}`;
}

export function orderWhatsAppText(product: Pick<Product, "sku" | "image">): string {
  const imageUrl = absoluteMediaUrl(product.image);
  return `Hello Eunik, Trust you're doing fine. I'll like to order ${product.sku} as seen on the website | ${imageUrl} | Please provide the quote. The measurement details are ....`;
}

/**
 * Mobile-first WhatsApp deep link.
 * Prefer wa.me — it opens the native app on iPhone; api.whatsapp.com/send often fails after async window.open.
 */
export function orderWhatsAppUrl(product: Pick<Product, "sku" | "image">): string {
  const phone = String(WHATSAPP_PHONE).replace(/\D/g, "");
  const text = orderWhatsAppText(product);
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

export function padCount(count: number): string {
  return count.toString().padStart(2, "0");
}

/** Fire lead + analytics without blocking the WhatsApp navigation (critical on iOS). */
export function trackWhatsAppOrder(product: Product): void {
  void (async () => {
    try {
      const { trackEvent } = await import("@/lib/track");
      trackEvent("whatsapp_click", { sku: product.sku });
      await db.leads.createFromWhatsApp(product.id);
    } catch (error) {
      if (error instanceof ForbiddenError) {
        toast.error(error.message);
        return;
      }
      console.warn("[whatsapp] lead track failed", error);
    }
  })();
}

/**
 * Open WhatsApp in a way that works on iPhone Safari.
 * Must stay synchronous with the user gesture — no await before navigation.
 */
export function openProductWhatsApp(product: Product): void {
  trackWhatsAppOrder(product);
  const url = orderWhatsAppUrl(product);
  // Same-tab navigation is most reliable on iOS; desktop can use a new tab.
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (isIOS) {
    window.location.href = url;
    return;
  }
  const opened = window.open(url, "_blank", "noopener,noreferrer");
  if (!opened) {
    window.location.href = url;
  }
}
