import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import PageHero from "@/components/PageHero";
import StaffShopGuard from "@/components/StaffShopGuard";
import PayMethods, { type PayChoice } from "@/components/PayMethods";
import { useCart } from "@/context/CartProvider";
import { useSession } from "@/context/SessionProvider";
import { db } from "@/db/database";
import { useAsync } from "@/hooks/useAsync";
import { formatNaira } from "@/lib/money";

export default function Checkout() {
  const { cart, refresh: refreshCart } = useCart();
  const { user, refresh } = useSession();
  const navigate = useNavigate();
  const { data: settings } = useAsync(() => db.settings.get(), []);
  const [fulfillment, setFulfillment] = useState<"pickup_ibadan" | "delivery">("pickup_ibadan");
  const [busy, setBusy] = useState(false);
  const totals = cart ? db.cart.totals(cart) : { subtotal: 0, discount: 0, payable: 0 };
  const { data: shipping } = useAsync(
    () => db.checkout.quoteShipping(fulfillment, totals.payable),
    [fulfillment, totals.payable],
  );
  const amount = totals.payable + (shipping ?? 0);
  const hasMtm = cart?.lines.some((line) => line.kind === "mtm");

  async function pay(choice: PayChoice) {
    if (!cart?.lines.length) {
      toast.error("Your bag is empty.");
      return;
    }
    const form = document.getElementById("checkout-form") as HTMLFormElement | null;
    if (form && !form.reportValidity()) return;
    const data = form ? new FormData(form) : new FormData();
    setBusy(true);
    try {
      const email = String(data.get("email") ?? user?.email ?? "");
      const name = String(data.get("name") ?? user?.name ?? "Guest");
      const phone = String(data.get("phone") ?? user?.phone ?? "");
      const ensured = await db.auth.ensureAtCheckout({ email, name, phone });
      if ("needsLogin" in ensured) {
        toast.message("That email already has a client book. Sign in to continue.");
        navigate(`/account/login?next=/checkout&email=${encodeURIComponent(ensured.email)}`);
        return;
      }
      await refresh();
      await refreshCart();
      const order = await db.checkout.placeOrder({
        fulfillment,
        address: String(data.get("address") ?? ""),
        name,
        email,
        phone,
        couponCode: cart.couponCode,
        payment: choice,
      });
      await refreshCart();
      if (ensured.created) {
        sessionStorage.setItem("eunik-welcome", JSON.stringify({ email: ensured.user.email }));
        if (ensured.mailTo) window.open(ensured.mailTo, "_blank", "noopener,noreferrer");
        toast.success("Account opened. Check the mailbox on this demo for sign-in details.");
      } else {
        toast.success(choice.method === "paystack" ? "Demo Paystack recorded." : "Receipt sent to the house.");
      }
      navigate(`/orders/thank-you/${order.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Checkout failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <StaffShopGuard>
      <PageHero title="Checkout" crumb="Checkout" />
      <section className="mx-auto grid max-w-5xl gap-10 px-6 py-10 lg:grid-cols-2">
        <form id="checkout-form" className="space-y-4">
          <label className="block">
            <span className="os-label">Full name</span>
            <input name="name" required defaultValue={user?.name} className="mt-1 w-full border border-line px-3 py-2 text-ink" />
          </label>
          <label className="block">
            <span className="os-label">Email</span>
            <input name="email" type="email" required defaultValue={user?.email} className="mt-1 w-full border border-line px-3 py-2 text-ink" />
          </label>
          <label className="block">
            <span className="os-label">Phone</span>
            <input name="phone" required defaultValue={user?.phone} className="mt-1 w-full border border-line px-3 py-2 text-ink" />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setFulfillment("pickup_ibadan")}
              className={`rounded-2xl border p-4 text-left ${fulfillment === "pickup_ibadan" ? "border-ink" : "border-line"}`}
            >
              Pickup · Ibadan HQ
            </button>
            <button
              type="button"
              onClick={() => setFulfillment("delivery")}
              className={`rounded-2xl border p-4 text-left ${fulfillment === "delivery" ? "border-ink" : "border-line"}`}
            >
              Delivery · Nigeria
            </button>
          </div>
          {fulfillment === "delivery" ? (
            <label className="block">
              <span className="os-label">Address</span>
              <textarea name="address" required className="mt-1 w-full border border-line px-3 py-2 text-ink" />
            </label>
          ) : (
            <p className="text-sm">{settings?.pickupLocation}</p>
          )}
        </form>
        <div>
          <p className="mb-2 font-alt text-2xl text-ink">Pay {formatNaira(amount)}</p>
          <p className="mb-4 text-sm">
            Checking out opens a client book if you do not have one — check the mailbox on this demo for a set-password step.
            Change it later in Profile.
          </p>
          <p className="mb-4 text-sm">
            Subtotal {formatNaira(totals.payable)}
            {totals.discount > 0 ? ` · saved ${formatNaira(totals.discount)}` : ""} · shipping{" "}
            {formatNaira(shipping ?? 0)}
          </p>
          <PayMethods
            amountKobo={hasMtm ? Math.round((amount * (settings?.depositPercent ?? 60)) / 100) : amount}
            busy={busy}
            onPay={(choice) => pay(choice)}
          />
        </div>
      </section>
    </StaffShopGuard>
  );
}
