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

export function orderWhatsAppUrl(product: Pick<Product, "sku" | "image">): string {
  const imageUrl = absoluteMediaUrl(product.image);
  const text = `Hello Eunik, Trust you're doing fine. I'll like to order ${product.sku} as seen on the website | ${imageUrl} | Please provide the quote. The measurement details are ....`;
  return `https://api.whatsapp.com/send/?phone=${WHATSAPP_PHONE}&text=${encodeURIComponent(text)}&type=phone_number&app_absent=0`;
}

export function padCount(count: number): string {
  return count.toString().padStart(2, "0");
}

export async function openProductWhatsApp(product: Product): Promise<void> {
  try {
    const { trackEvent } = await import("@/lib/track");
    trackEvent("whatsapp_click", { sku: product.sku });
    await db.leads.createFromWhatsApp(product.id);
    window.open(orderWhatsAppUrl(product), "_blank", "noopener,noreferrer");
  } catch (error) {
    if (error instanceof ForbiddenError) {
      toast.error(error.message);
      return;
    }
    throw error;
  }
}
