import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
import { trackEvent } from "@/lib/track";

export default function Checkout() {
  const { cart, refresh: refreshCart } = useCart();
  const { user, refresh } = useSession();
  const navigate = useNavigate();
  const { data: settings } = useAsync(() => db.settings.get(), []);
  const [fulfillment, setFulfillment] = useState<"pickup_ibadan" | "delivery">("pickup_ibadan");
  const [agreedPolicies, setAgreedPolicies] = useState(false);
  const [busy, setBusy] = useState(false);
  const [payMode, setPayMode] = useState<"deposit" | "full">("deposit");
  const totals = cart ? db.cart.totals(cart) : { subtotal: 0, discount: 0, payable: 0 };
  const { data: shipping } = useAsync(
    () => db.checkout.quoteShipping(fulfillment, totals.payable),
    [fulfillment, totals.payable],
  );
  const hasPriceRequest = cart?.lines.some((line) => line.priceOnRequest) ?? false;
  const merchandise = totals.payable + (shipping ?? 0);
  const depositPercent = Math.min(100, Math.max(70, settings?.depositPercent ?? 70));
  const depositAmount = merchandise > 0 ? Math.min(merchandise, Math.ceil((merchandise * depositPercent) / 100)) : 0;
  const amount = merchandise <= 0 ? 0 : payMode === "deposit" ? depositAmount : merchandise;
  const balanceIfDeposit = Math.max(0, merchandise - depositAmount);

  useEffect(() => {
    if (cart?.lines.length) trackEvent("begin_checkout", { path: "/checkout" });
  }, [cart?.lines.length]);

  async function pay(choice: PayChoice) {
    if (!cart?.lines.length) {
      toast.error("Your bag is empty.");
      return;
    }
    if (!agreedPolicies) {
      toast.error("Please confirm you agree to our policies and terms before paying.");
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
            ...(line.variantId ? { variantId: line.variantId } : {}),
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
        const payType = payMode === "deposit" ? "deposit" : "full";
        const payAmount = payMode === "deposit" ? placed.depositKobo : placed.totalKobo;
        if (payAmount > 0) {
          if (choice.method === "paystack") {
            const result = await openPaystackCheckout({
              orderId,
              email,
              amountKobo: payAmount,
              type: payType,
            });
            toast.success(
              result.demo
                ? "Demo Paystack recorded."
                : payType === "deposit"
                  ? "Minimum payment received — balance is due before delivery."
                  : "Payment successful.",
            );
          } else {
            await httpPayments.submitTransfer({
              orderId,
              transactionNumber: choice.transactionNumber,
              receiptUrl: choice.receiptUrl,
              type: payType,
            });
            toast.success("Transfer submitted — waiting for house confirmation.");
          }
        } else {
          toast.success(
            hasPriceRequest
              ? "Order placed — the house will confirm pricing and email you."
              : "Order placed.",
          );
        }
        if ("accountCreated" in placed && placed.accountCreated) {
          toast.message("We emailed your temporary password — it stays valid until you change it from Profile.");
        }
        await refreshCart();
        try {
          sessionStorage.setItem(
            `eunik-thanks-${orderId}`,
            JSON.stringify({
              totalKobo: placed.totalKobo,
              depositKobo: placed.depositKobo,
              paidTowardKobo: payAmount > 0 ? payAmount : 0,
              payMode: payAmount > 0 ? payType : "none",
              method: payAmount > 0 ? choice.method : "none",
              awaitingBank: choice.method === "bank_transfer" && payAmount > 0,
            }),
          );
        } catch {
          /* ignore */
        }
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
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-paper/50 p-4 text-sm leading-6 text-ink">
            <input
              type="checkbox"
              required
              checked={agreedPolicies}
              onChange={(event) => setAgreedPolicies(event.target.checked)}
              className="mt-1 h-4 w-4 shrink-0 accent-ink"
            />
            <span>
              By continuing to order and pay, I agree to EUNIK’s{" "}
              <Link to="/policies/terms" className="underline decoration-ink/30 underline-offset-2 hover:text-ink" target="_blank" rel="noreferrer">
                Terms &amp; Conditions
              </Link>
              ,{" "}
              <Link to="/policies/order" className="underline decoration-ink/30 underline-offset-2 hover:text-ink" target="_blank" rel="noreferrer">
                Order Policy
              </Link>
              ,{" "}
              <Link to="/policies/jobs" className="underline decoration-ink/30 underline-offset-2 hover:text-ink" target="_blank" rel="noreferrer">
                Job Taking Policy
              </Link>
              ,{" "}
              <Link to="/policies/privacy" className="underline decoration-ink/30 underline-offset-2 hover:text-ink" target="_blank" rel="noreferrer">
                Privacy Policy
              </Link>
              , and{" "}
              <Link to="/policies/ndpr" className="underline decoration-ink/30 underline-offset-2 hover:text-ink" target="_blank" rel="noreferrer">
                NDPR Notice
              </Link>
              .
            </span>
          </label>
        </form>
        <div>
          <p className="mb-2 font-alt text-2xl text-ink">
            {amount > 0 ? `Pay ${formatNaira(amount)}` : hasPriceRequest ? "Request for price" : "No payment due"}
          </p>
          <p className="mb-4 text-sm">
            {hasPriceRequest && merchandise === 0
              ? "Place the order like a normal checkout. The house will confirm pricing and email you."
              : hasPriceRequest && merchandise > 0
                ? `Pay for priced looks now. Request-for-price looks wait for a house quote.`
                : "Pay at least 70% now, or settle the full amount. Any balance is due before delivery."}
          </p>
          {merchandise > 0 ? (
            <div className="mb-4 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setPayMode("deposit")}
                className={`rounded-2xl border p-3 text-left text-sm transition-colors hover:border-ink ${payMode === "deposit" ? "border-ink bg-paper" : "border-line"}`}
              >
                <p className="font-medium text-ink">Pay {depositPercent}% now</p>
                <p className="text-muted">{formatNaira(depositAmount)} · balance {formatNaira(balanceIfDeposit)} later</p>
              </button>
              <button
                type="button"
                onClick={() => setPayMode("full")}
                className={`rounded-2xl border p-3 text-left text-sm transition-colors hover:border-ink ${payMode === "full" ? "border-ink bg-paper" : "border-line"}`}
              >
                <p className="font-medium text-ink">Pay in full</p>
                <p className="text-muted">{formatNaira(merchandise)}</p>
              </button>
            </div>
          ) : null}
          {cart?.lines.length ? (
            <ul className="mb-6 space-y-2 border border-line p-4 text-sm">
              {cart.lines.map((line) => (
                <li key={line.id} className="flex justify-between gap-3">
                  <span>
                    {line.name ?? "Look"} × {line.qty}
                    <span className="mt-0.5 block text-xs text-muted">
                      {line.kind === "mtm" ? "Made to measure" : "Ready to wear"}
                      {line.priceOnRequest ? " · Request for price" : ""}
                    </span>
                  </span>
                  <span>
                    {line.priceOnRequest ? "Request for price" : formatNaira((line.priceKobo ?? 0) * line.qty)}
                  </span>
                </li>
              ))}
              {shipping != null && fulfillment === "delivery" ? (
                <li className="flex justify-between text-muted">
                  <span>Delivery</span>
                  <span>{formatNaira(shipping)}</span>
                </li>
              ) : null}
              <li className="flex justify-between border-t border-line pt-2 font-medium text-ink">
                <span>Subtotal</span>
                <span>{hasPriceRequest && totals.subtotal === 0 ? "—" : formatNaira(totals.subtotal)}</span>
              </li>
            </ul>
          ) : null}
          <PayMethods
            amountKobo={Math.max(amount, 0)}
            busy={busy}
            disabled={!agreedPolicies}
            onPay={pay}
            placeOnly={amount === 0}
          />
          {!agreedPolicies ? (
            <p className="mt-3 text-sm text-muted">Tick the policy agreement above to enable payment.</p>
          ) : null}
        </div>
      </section>
    </StaffShopGuard>
  );
}
