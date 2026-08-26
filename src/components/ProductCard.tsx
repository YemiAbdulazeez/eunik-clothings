import { Link, useLocation } from "react-router-dom";
import { Loader2, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import ProductImageSlider, { productGallery } from "@/components/ProductImageSlider";
import WishlistHeart from "@/components/WishlistHeart";
import { db, type Product } from "@/db/database";
import { formatNaira } from "@/lib/money";
import { openProductWhatsApp } from "@/lib/whatsapp";
import { shopHref } from "@/lib/osNav";
import { useSession } from "@/context/SessionProvider";
import { useCart } from "@/context/CartProvider";
import { canShop, isHouseStaff } from "@/lib/rbac";
import { trackEvent } from "@/lib/track";

export default function ProductCard({ product }: { product: Product }) {
  const location = useLocation();
  const { user } = useSession();
  const { refresh } = useCart();
  const [busy, setBusy] = useState(false);
  const href = shopHref(location.pathname, product.sku);
  const shopper = canShop(user);
  const showWhatsApp = !isHouseStaff(user);
  const gallery = productGallery(product);

  async function add() {
    if (busy) return;
    try {
      if (!product.priceOnRequest && !product.sellsRtw) {
        toast.message("This look is made to measure.", {
          description: "Open it to choose cloth and measurements.",
        });
        return;
      }
      setBusy(true);
      // Request-for-price and MTM-only looks go in as mtm so guest checkout works like a normal order.
      await db.cart.add({
        productId: product.id,
        kind: product.priceOnRequest || !product.sellsRtw ? "mtm" : "rtw",
        qty: 1,
      });
      await refresh();
      trackEvent("add_to_bag", { sku: product.sku, path: href });
      toast.success(product.priceOnRequest ? "Request for price in your bag." : "Added to your bag.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add to bag.");
    } finally {
      setBusy(false);
    }
  }

  const addButton = shopper ? (
    <button
      type="button"
      disabled={busy}
      onClick={() => void add()}
      className="inline-flex items-center justify-center rounded-full bg-ink px-3 py-2 text-[13px] text-white hover:bg-gold disabled:cursor-not-allowed disabled:opacity-70"
    >
      {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShoppingBag className="mr-2 h-4 w-4" />}
      {busy ? "Adding…" : product.priceOnRequest ? "Add request" : "Add to bag"}
    </button>
  ) : null;

  const whatsAppButton = showWhatsApp ? (
    <button
      type="button"
      onClick={() => void openProductWhatsApp(product)}
      className="inline-flex items-center justify-center gap-2 rounded-full border-2 bg-white px-3 py-2 text-[13px] text-black hover:border-green-600 hover:bg-green-600 hover:text-white"
    >
      WhatsApp
    </button>
  ) : null;

  const media = (
    <div className="relative mb-3 overflow-hidden bg-paper sm:mb-5">
      <Link to={href} className="block">
        <ProductImageSlider images={gallery} alt={product.name} />
        <span className="absolute left-2 top-2 z-10 rounded-full bg-white px-2 py-0.5 text-[9px] font-medium uppercase tracking-wide text-ink sm:left-3 sm:top-3 sm:px-3 sm:py-1 sm:text-[11px]">
          {product.sku}
        </span>
      </Link>
      <WishlistHeart productId={product.id} className="absolute right-3 top-3 z-10" />
      {shopper || showWhatsApp ? (
        <div className="product-cta absolute bottom-5 left-1/2 z-10 hidden w-[90%] -translate-x-1/2 translate-y-2 flex-col gap-2 opacity-0 transition sm:flex sm:flex-row sm:justify-center">
          {addButton}
          {whatsAppButton}
        </div>
      ) : null}
    </div>
  );

  return (
    <article className="product-card group text-center">
      {media}
      {(shopper || showWhatsApp) && (addButton || whatsAppButton) ? (
        <div className="mb-4 flex flex-col gap-2 px-2 sm:hidden">
          {addButton}
          {whatsAppButton}
        </div>
      ) : null}
      <Link to={href} className="font-alt text-base font-medium text-ink hover:text-ink/70 sm:text-[19px]">
        {product.name}
      </Link>
      <p className="mt-1 text-xs text-ink sm:text-sm">
        {product.priceOnRequest ? "Request for price" : formatNaira(product.priceKobo)}
      </p>
    </article>
  );
}
