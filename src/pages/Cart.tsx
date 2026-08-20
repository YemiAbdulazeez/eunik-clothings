import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import PageHero from "@/components/PageHero";
import StaffShopGuard from "@/components/StaffShopGuard";
import { db } from "@/db/database";
import { useCart } from "@/context/CartProvider";
import { useAsync } from "@/hooks/useAsync";
import { formatNaira } from "@/lib/money";

export default function CartPage() {
  const { cart, refresh } = useCart();
  const { data: products } = useAsync(() => db.products.list(), []);
  const navigate = useNavigate();
  const totals = cart ? db.cart.totals(cart) : { subtotal: 0, discount: 0, payable: 0 };

  async function coupon(form: HTMLFormElement) {
    const code = String(new FormData(form).get("code") ?? "");
    const result = await db.cart.applyCoupon(code);
    if ("error" in result) toast.error(result.error);
    else toast.success(`${result.percent}% applied.`);
    await refresh();
  }

  return (
    <StaffShopGuard>
      <PageHero title="Your bag" crumb="Cart" />
      <section className="mx-auto max-w-5xl px-6 py-10">
        {!cart?.lines.length ? (
          <div className="text-center">
            <p>The bag is empty.</p>
            <Link to="/shop" className="mt-6 inline-block bg-ink px-6 py-3 text-white">
              Continue shopping
            </Link>
          </div>
        ) : (
          <div className="grid gap-10 lg:grid-cols-[1fr_280px]">
            <ul className="space-y-6">
              {cart.lines.map((line) => {
                const product = products?.find((item) => item.id === line.productId);
                if (!product) return null;
                return (
                  <li key={line.id} className="flex gap-4 border-b border-line pb-6">
                    <img src={product.image} alt="" className="h-28 w-24 object-cover" />
                    <div className="flex-1">
                      <p className="font-alt text-xl text-ink">{product.name}</p>
                      <p className="text-sm uppercase">{product.sku} · {line.kind === "mtm" ? "Made to measure" : "Ready to wear"}</p>
                      <p className="mt-1 text-ink">{formatNaira(product.priceKobo)}</p>
                      <div className="mt-3 flex items-center gap-3">
                        <input
                          type="number"
                          min={1}
                          value={line.qty}
                          className="w-16 border border-line px-2 py-1 text-ink"
                          onChange={(event) => {
                            void db.cart.updateQty(line.id, Number(event.target.value)).then(() => refresh());
                          }}
                        />
                        <button
                          type="button"
                          className="text-sm underline"
                          onClick={() => void db.cart.remove(line.id).then(() => refresh())}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            <aside className="h-fit border border-line p-6">
              <p className="font-alt text-xl text-ink">Summary</p>
              <p className="mt-4 flex justify-between">
                <span>Subtotal</span>
                <span>{formatNaira(totals.subtotal)}</span>
              </p>
              {totals.discount > 0 ? (
                <p className="flex justify-between text-ink">
                  <span>Discount</span>
                  <span>−{formatNaira(totals.discount)}</span>
                </p>
              ) : null}
              <form
                className="mt-4 flex gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  void coupon(event.currentTarget);
                }}
              >
                <input name="code" placeholder="Coupon" defaultValue={cart.couponCode} className="flex-1 border border-line px-3 py-2 text-sm" />
                <button type="submit" className="border border-ink px-3 text-sm text-ink">
                  Apply
                </button>
              </form>
              <button
                type="button"
                className="mt-6 w-full bg-ink py-3 text-white"
                onClick={() => navigate("/checkout")}
              >
                Checkout {formatNaira(totals.payable)}
              </button>
            </aside>
          </div>
        )}
      </section>
    </StaffShopGuard>
  );
}
