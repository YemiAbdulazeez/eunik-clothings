import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { type FormEvent, type ReactNode, useState } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import PageHero from "@/components/PageHero";
import { PageHeader } from "@/components/os/ui";
import { db } from "@/db/database";
import { useAsync } from "@/hooks/useAsync";
import { formatNaira } from "@/lib/money";
import { openProductWhatsApp } from "@/lib/whatsapp";
import { useSession } from "@/context/SessionProvider";
import { inAccount, mtmHref } from "@/lib/osNav";
import { canShop, isHouseStaff } from "@/lib/rbac";

export default function ProductDetail() {
  const { sku = "" } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const embedded = inAccount(location.pathname);
  const { user } = useSession();
  const { data: product, loading } = useAsync(() => db.products.getBySku(sku), [sku]);
  const { data: variants } = useAsync(
    () => (product ? db.products.variants(product.id) : Promise.resolve([])),
    [product?.id],
  );
  const { data: reviews } = useAsync(
    () => (product ? db.reviews.forProduct(product.id) : Promise.resolve([])),
    [product?.id],
  );
  const [size, setSize] = useState("");
  const [photo, setPhoto] = useState(0);
  const [busy, setBusy] = useState(false);

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

  if (loading) return shell("Look", <p className="px-6 py-20 text-center">Finding the garment…</p>);
  if (!product) return shell("Look", <p className="px-6 py-20 text-center">That SKU is not on the rail.</p>);

  const look = product;
  const images = look.images?.length ? look.images : [look.image];
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
      if (quote) {
        toast.message("This look is request-for-price. Open a custom request or WhatsApp the house.");
        navigate(embedded ? "/account/custom" : "/bespoke");
        return;
      }
      await db.cart.add({
        productId: look.id,
        kind: kind === "preorder" || !look.sellsRtw ? "mtm" : "rtw",
        qty: 1,
        variantId: variants?.find((item) => item.size === size)?.id,
      });
      toast.success(kind === "preorder" || out ? "Pre-order in your bag." : "Added to your bag.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add to bag.");
    } finally {
      setBusy(false);
    }
  }

  function makeToMeasure() {
    if (!user) {
      navigate(`/account/login?next=${mtmHref(location.pathname, look.sku)}`);
      return;
    }
    navigate(mtmHref(location.pathname, look.sku));
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
        <div className="bg-paper">
          <img src={images[photo] ?? look.image} alt={look.name} className="w-full object-cover" />
        </div>
        {images.length > 1 ? (
          <div className="mt-3 flex gap-2 overflow-x-auto">
            {images.map((src, index) => (
              <button key={src + index} type="button" onClick={() => setPhoto(index)}>
                <img src={src} alt="" className={`h-16 w-16 rounded-lg object-cover ${photo === index ? "ring-2 ring-ink" : ""}`} />
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <div>
        <span className="rounded-full border border-line px-3 py-1 text-[11px] uppercase tracking-wide text-ink">
          {look.sku}
        </span>
        <h1 className="mt-4 font-alt text-4xl text-ink">{look.name}</h1>
        <p className="mt-3 text-2xl font-medium text-ink">{quote ? "Request for price" : formatNaira(look.priceKobo)}</p>
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
            <button type="button" disabled={busy} onClick={() => void addToBag("rtw")} className="rounded-full bg-ink px-6 py-3 text-sm text-white">
              Add to bag
            </button>
          ) : null}
          {canShopHere && (quote || out || !look.sellsRtw) ? (
            <button type="button" disabled={busy} onClick={() => void addToBag("preorder")} className="rounded-full bg-ink px-6 py-3 text-sm text-white">
              {quote ? "Request price / pre-order" : "Pre-order"}
            </button>
          ) : null}
          {canShopHere && look.sellsMtm ? (
            <button type="button" onClick={makeToMeasure} className="rounded-full bg-gold px-6 py-3 text-sm text-ink">
              Make this <span className="highlight">to measure</span>
            </button>
          ) : null}
          {showWhatsApp ? (
            <button type="button" onClick={() => void openProductWhatsApp(look)} className="rounded-full border border-ink px-6 py-3 text-sm text-ink">
              Order on WhatsApp
            </button>
          ) : null}
        </div>
        {canShopHere ? (
          <p className="mt-6 text-sm">
            Pickup at Eunik HQ, Ibadan · Free delivery over ₦100,000 ·{" "}
            <Link to="/cart" className="text-ink underline">
              View bag
            </Link>
          </p>
        ) : (
          <p className="mt-6 text-sm">Pickup at Eunik HQ, Ibadan · Free delivery over ₦100,000</p>
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
