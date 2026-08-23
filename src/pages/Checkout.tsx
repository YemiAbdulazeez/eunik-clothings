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
import { openPaystackCheckout } from "@/lib/paystack";
import { HTTP_ENABLED, httpOrders, httpPayments } from "@/api/http";
import { emitCartChange } from "@/lib/cartEvents";

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

      if (HTTP_ENABLED) {
        const placed = await httpOrders.place({
          lines: cart.lines.map((line) => ({
            productId: line.productId,
            variantId: line.variantId,
            kind: line.kind,
            qty: line.qty,
          })),
          customer: { name, email, phone },
          fulfillment,
          address: String(data.get("address") ?? ""),
          couponCode: cart.couponCode,
        });
        if ("needsLogin" in placed && placed.needsLogin) {
          toast.message("That email already has a client book. Sign in to continue.");
          navigate(`/account/login?next=/checkout&email=${encodeURIComponent(email)}`);
          return;
        }
        // Guest checkout opens an account and sets cookies — refresh session before paying
        await refresh();
        emitCartChange();
        await refreshCart();

        const orderId = placed.orderId;
        const payAmount = hasMtm ? placed.depositKobo : placed.totalKobo;
        if (choice.method === "paystack") {
          const result = await openPaystackCheckout({
            orderId,
            email,
            amountKobo: payAmount,
            type: hasMtm ? "deposit" : "full",
          });
          toast.success(result.demo ? "Demo Paystack recorded." : "Payment successful.");
        } else {
          await httpPayments.submitTransfer({
            orderId,
            transactionNumber: choice.transactionNumber,
            receiptUrl: choice.receiptDataUrl,
            type: hasMtm ? "deposit" : "full",
          });
          toast.success("Receipt sent to the house.");
        }
        if ("accountCreated" in placed && placed.accountCreated) {
          toast.message("We emailed your temporary password — change it after you sign in next time.");
        }
        await refreshCart();
        navigate(`/orders/thank-you/${orderId}`);
        return;
      }

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
          {!user ? (
            <p className="rounded-xl border border-line bg-paper/60 px-3 py-2 text-sm text-muted">
              No account needed to pay. We will open a client book with your email and send temporary sign-in details.
            </p>
          ) : null}
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
              className={`rounded-2xl border p-4 text-left transition-colors hover:border-ink ${fulfillment === "pickup_ibadan" ? "border-ink" : "border-line"}`}
            >
              Pickup · Ibadan HQ
            </button>
            <button
              type="button"
              onClick={() => setFulfillment("delivery")}
              className={`rounded-2xl border p-4 text-left transition-colors hover:border-ink ${fulfillment === "delivery" ? "border-ink" : "border-line"}`}
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
            {hasMtm ? "Made-to-measure: deposit due now; balance before collection." : "Full amount due at checkout."}
          </p>
          <PayMethods amountKobo={amount} busy={busy} onPay={pay} />
        </div>
      </section>
    </StaffShopGuard>
  );
}
