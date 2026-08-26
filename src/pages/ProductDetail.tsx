import { Link, useLocation, useParams } from "react-router-dom";
import { type FormEvent, type ReactNode, useEffect, useState } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import LazyImage from "@/components/LazyImage";
import LoadingButton from "@/components/LoadingButton";
import PageHero from "@/components/PageHero";
import ShareBar from "@/components/ShareBar";
import WishlistHeart from "@/components/WishlistHeart";
import { PageSkeleton } from "@/components/Skeleton";
import { PageHeader } from "@/components/os/ui";
import { db } from "@/db/database";
import { useAsync } from "@/hooks/useAsync";
import { formatNaira } from "@/lib/money";
import { orderWhatsAppUrl, trackWhatsAppOrder } from "@/lib/whatsapp";
import { useSession } from "@/context/SessionProvider";
import { useCart } from "@/context/CartProvider";
import { inAccount } from "@/lib/osNav";
import { canShop, isHouseStaff } from "@/lib/rbac";
import { trackEvent } from "@/lib/track";
import { statusLabel } from "@/lib/format";

export default function ProductDetail() {
  const { sku = "" } = useParams();
  const location = useLocation();
  const embedded = inAccount(location.pathname);
  const { user } = useSession();
  const { refresh: refreshCart } = useCart();
  const { data: product, loading } = useAsync(() => db.products.getBySku(sku), [sku]);
  const { data: variants } = useAsync(async () => {
    if (!product) return [];
    if (product.variants?.length) return product.variants;
    return db.products.variants(product.id);
  }, [product?.id, product?.variants]);
  const { data: reviews } = useAsync(
    () => (product ? db.reviews.forProduct(product.id) : Promise.resolve([])),
    [product?.id],
  );
  const [size, setSize] = useState("");
  const [photo, setPhoto] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (product?.sku) trackEvent("view_item", { sku: product.sku, path: location.pathname });
  }, [product?.sku, location.pathname]);

  const shell = (title: string, body: ReactNode) =>
    embedded ? (
      <div className="space-y-6">
        <PageHeader title={title} />
        {body}
      </div>
    ) : (
      <>
        <PageHero title={title} crumb="Shop" />
        {body}
      </>
    );

  if (loading) return shell("Look", <PageSkeleton />);
  if (!product) return shell("Look", <p className="px-6 py-20 text-center">That SKU is not on the rail.</p>);

  const look = product;
  const images = [...new Set((look.images?.length ? look.images : [look.image]).filter(Boolean))];
  const quote = Boolean(look.priceOnRequest);
  const out = (variants ?? []).length > 0 && (variants ?? []).every((item) => item.stock <= 0);
  const canShopHere = canShop(user);
  const showWhatsApp = !isHouseStaff(user);

  async function addToBag(kind: "rtw" | "preorder") {
    if (!quote && kind === "rtw" && variants && variants.length > 0 && !size) {
      toast.error("Choose a size first.");
      return;
    }
    setBusy(true);
    try {
      await db.cart.add({
        productId: look.id,
        kind: quote || kind === "preorder" || !look.sellsRtw ? "mtm" : "rtw",
        qty: 1,
        variantId: quote ? undefined : variants?.find((item) => item.size === size)?.id,
      });
      await refreshCart();
      trackEvent("add_to_bag", { sku: look.sku, path: location.pathname });
      toast.success(
        quote
          ? "Request for price in your bag — checkout like a normal order."
          : kind === "preorder" || out
            ? "Pre-order in your bag."
            : "Added to your bag.",
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add to bag.");
    } finally {
      setBusy(false);
    }
  }

  async function review(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || user.role !== "client") {
      toast.error("Sign in as a client to review.");
      return;
    }
    const data = new FormData(event.currentTarget);
    try {
      await db.reviews.create({
        productId: look.id,
        rating: Number(data.get("rating")),
        body: String(data.get("body")),
      });
      toast.success("Review sent for the house to publish.");
      event.currentTarget.reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not review.");
    }
  }

  const body = (
    <section className={`mx-auto grid max-w-6xl gap-12 ${embedded ? "" : "px-6 py-10"} lg:grid-cols-2`}>
      <div>
        <LazyImage
          src={images[photo] ?? look.image}
          alt={look.name}
          className="aspect-[3/4] w-full object-cover"
          aspectClassName="aspect-[3/4] w-full bg-paper"
        />
        {images.length > 1 ? (
          <div className="mt-3 flex gap-2 overflow-x-auto">
            {images.map((src, index) => (
              <button key={src + index} type="button" onClick={() => setPhoto(index)} className="hover:opacity-80">
                <LazyImage
                  src={src}
                  alt=""
                  className={`h-16 w-16 rounded-lg object-cover ${photo === index ? "ring-2 ring-ink" : ""}`}
                  wrapperClassName="h-16 w-16 rounded-lg"
                />
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-line px-3 py-1 text-[11px] uppercase tracking-wide text-ink">
            {look.sku}
          </span>
          {look.sellsRtw ? (
            <span className="rounded-full bg-paper px-3 py-1 text-[11px] uppercase tracking-wide text-ink">
              {statusLabel("ready_to_wear")}
            </span>
          ) : null}
          {look.sellsMtm || quote || !look.sellsRtw ? (
            <span className="rounded-full bg-paper px-3 py-1 text-[11px] uppercase tracking-wide text-ink">
              {statusLabel("made_to_measure")}
            </span>
          ) : null}
          {quote ? (
            <span className="rounded-full bg-gold/40 px-3 py-1 text-[11px] uppercase tracking-wide text-ink">
              Request for price
            </span>
          ) : null}
          <WishlistHeart productId={look.id} className="ml-auto" />
        </div>
        <h1 className="mt-4 font-alt text-4xl text-ink">{look.name}</h1>
        <p className="mt-3 text-2xl font-medium text-ink">{quote ? "Request for price" : formatNaira(look.priceKobo)}</p>
        <div className="mt-4">
          <ShareBar title={look.name} text={`${look.name} · ${look.sku}`} />
        </div>
        <p className="mt-6 leading-8">{look.description}</p>
        {variants && variants.length > 0 ? (
          <div className="mt-8">
            <p className="os-label mb-2">Size</p>
            <div className="flex flex-wrap gap-2">
              {variants.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSize(item.size)}
                  className={`rounded-full border px-4 py-2 text-sm ${
                    size === item.size ? "border-ink bg-ink text-white" : "border-line text-ink"
                  }`}
                >
                  {item.size} · {item.stock} left
                </button>
              ))}
            </div>
          </div>
        ) : null}
        <div className="mt-10 flex flex-wrap gap-3">
          {canShopHere && look.sellsRtw && !quote && !out ? (
            <LoadingButton loading={busy} loadingText="Adding…" onClick={() => void addToBag("rtw")}>
              Add to bag
            </LoadingButton>
          ) : null}
          {canShopHere && (quote || out || !look.sellsRtw) ? (
            <LoadingButton loading={busy} loadingText="Adding…" onClick={() => void addToBag("preorder")}>
              {quote ? "Add to bag · request price" : "Pre-order"}
            </LoadingButton>
          ) : null}
          {showWhatsApp ? (
            <a
              href={orderWhatsAppUrl(look)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackWhatsAppOrder(look)}
              className="os-pill inline-flex items-center justify-center gap-2 border-2 border-[#25D366]/40 bg-white px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:border-[#25D366] hover:bg-[#25D366] hover:text-white"
            >
              Order on WhatsApp
            </a>
          ) : null}
        </div>
        {canShopHere ? (
          <p className="mt-6 text-sm">
            Pickup at Eunik HQ, Ibadan ·{" "}
            <Link to="/cart" className="text-ink underline">
              View bag
            </Link>
          </p>
        ) : (
          <p className="mt-6 text-sm">Pickup at Eunik HQ, Ibadan</p>
        )}
      </div>
      <div className="lg:col-span-2 space-y-4">
        <h2 className="font-alt text-2xl text-ink">Reviews</h2>
        {(reviews ?? []).length === 0 ? <p className="text-sm">No published reviews yet.</p> : null}
        {(reviews ?? []).map((item) => (
          <article key={item.id} className="rounded-2xl border border-line p-4">
            <p className="flex items-center gap-2 font-medium text-ink">
              <Star className="h-4 w-4 fill-gold text-gold" /> {item.rating}/5 · {item.customerName}
            </p>
            <p className="mt-2 text-sm">{item.body}</p>
          </article>
        ))}
        {user?.role === "client" ? (
          <form onSubmit={(event) => void review(event)} className="rounded-2xl border border-line p-4 space-y-3">
            <p className="os-label">Write a review</p>
            <select name="rating" className="border border-line px-3 py-2 text-ink" defaultValue="5">
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} stars
                </option>
              ))}
            </select>
            <textarea name="body" required rows={3} className="w-full border border-line px-3 py-2 text-ink" />
            <button className="os-pill bg-ink text-white">Submit</button>
          </form>
        ) : null}
      </div>
    </section>
  );

  return shell(look.name, body);
}
