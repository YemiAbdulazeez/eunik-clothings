import { SITE_URL, WHATSAPP_PHONE } from "@/data/catalog";
import { db, ForbiddenError, type Product } from "@/db/database";
import { toast } from "sonner";

export function orderWhatsAppUrl(product: Pick<Product, "sku" | "image">): string {
  const text = `Hello Eunik, Trust you're doing fine. I'll like to order ${product.sku} as seen on the website | ${SITE_URL}${product.image} | Please provide the quote. The measurement details are ....`;
  return `https://api.whatsapp.com/send/?phone=${WHATSAPP_PHONE}&text=${encodeURIComponent(text)}&type=phone_number&app_absent=0`;
}

export function padCount(count: number): string {
  return count.toString().padStart(2, "0");
}

export async function openProductWhatsApp(product: Product): Promise<void> {
  try {
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
