import { Link, useLocation } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { db, type Product } from "@/db/database";
import { formatNaira } from "@/lib/money";
import { openProductWhatsApp } from "@/lib/whatsapp";
import { shopHref } from "@/lib/osNav";
import { useSession } from "@/context/SessionProvider";
import { canShop, isHouseStaff } from "@/lib/rbac";

export default function ProductCard({ product }: { product: Product }) {
  const location = useLocation();
  const { user } = useSession();
  const href = shopHref(location.pathname, product.sku);
  const shopper = canShop(user);
  const showWhatsApp = !isHouseStaff(user);

  async function add() {
    try {
      if (product.priceOnRequest) {
        toast.message("Request for price — open the look or WhatsApp the house.");
        return;
      }
      if (!product.sellsRtw) {
        toast.message("This look is made to measure.", {
          description: "Open it to choose cloth and measurements.",
        });
        return;
      }
      await db.cart.add({ productId: product.id, kind: "rtw", qty: 1 });
      toast.success("Added to your bag.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add to bag.");
    }
  }

  const addButton = shopper ? (
    <button
      type="button"
      onClick={() => void add()}
      className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-3 py-2 text-[13px] text-ink"
    >
      <ShoppingBag className="h-4 w-4" />
      {product.priceOnRequest ? "Request price" : "Add to bag"}
    </button>
  ) : null;

  const whatsAppButton = showWhatsApp ? (
    <button
      type="button"
      onClick={() => void openProductWhatsApp(product)}
      className="inline-flex items-center justify-center rounded-full bg-ink px-3 py-2 text-[13px] text-white"
    >
      WhatsApp
    </button>
  ) : null;

  if (!shopper && !showWhatsApp) {
    return (
      <article className="product-card group text-center">
        <div className="relative mb-5 overflow-hidden bg-paper">
          <Link to={href}>
            <img
              src={product.image}
              alt={product.name}
              className="aspect-[3/4] w-full object-cover transition duration-500 group-hover:scale-105"
            />
            <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-ink">
              {product.sku}
            </span>
          </Link>
        </div>
        <Link to={href} className="font-alt text-[19px] font-medium text-ink hover:text-ink/70">
          {product.name}
        </Link>
        <p className="mt-1 text-sm text-ink">
          {product.priceOnRequest ? "Request for price" : formatNaira(product.priceKobo)}
        </p>
      </article>
    );
  }

  return (
    <article className="product-card group text-center">
      <div className="relative mb-5 overflow-hidden bg-paper">
        <Link to={href}>
          <img
            src={product.image}
            alt={product.name}
            className="aspect-[3/4] w-full object-cover transition duration-500 group-hover:scale-105"
          />
          <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-ink">
            {product.sku}
          </span>
          <div className="product-overlay pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-0 transition" />
        </Link>
        <div className="product-cta absolute bottom-5 left-1/2 z-10 hidden w-[90%] -translate-x-1/2 translate-y-2 flex-col gap-2 opacity-0 transition sm:flex sm:flex-row sm:justify-center">
          {addButton}
          {whatsAppButton}
        </div>
      </div>
      <div className="mb-4 flex flex-col gap-2 px-2 sm:hidden">
        {addButton}
        {whatsAppButton}
      </div>
      <Link to={href} className="font-alt text-[19px] font-medium text-ink hover:text-ink/70">
        {product.name}
      </Link>
      <p className="mt-1 text-sm text-ink">
        {product.priceOnRequest ? "Request for price" : formatNaira(product.priceKobo)}
      </p>
    </article>
  );
}
