import { Link, useParams } from "react-router-dom";
import { useEffect, useMemo, useRef } from "react";
import PageHero from "@/components/PageHero";
import { AsyncGuard } from "@/components/AsyncState";
import { db } from "@/db/database";
import { useAsync } from "@/hooks/useAsync";
import { useSession } from "@/context/SessionProvider";
import { formatNaira } from "@/lib/money";
import { trackEvent } from "@/lib/track";

type ThanksSnapshot = {
  totalKobo: number;
  depositKobo: number;
  paidTowardKobo: number;
  payMode: "deposit" | "full" | "none";
  method?: string;
  awaitingBank?: boolean;
};

function pctOf(part: number, whole: number) {
  if (whole <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((part / whole) * 100)));
}

export default function ThankYou() {
  const { id = "" } = useParams();
  const { user } = useSession();
  const { data: order, loading, error } = useAsync(() => db.orders.get(id), [id]);
  const tracked = useRef(false);
  const welcome = useMemo(() => {
    try {
      const raw = sessionStorage.getItem("eunik-welcome");
      return raw ? (JSON.parse(raw) as { email: string }) : null;
    } catch {
      return null;
    }
  }, []);

  const snapshot = useMemo(() => {
    try {
      const raw = sessionStorage.getItem(`eunik-thanks-${id}`);
      return raw ? (JSON.parse(raw) as ThanksSnapshot) : null;
    } catch {
      return null;
    }
  }, [id]);

  useEffect(() => {
    if (!order || tracked.current) return;
    tracked.current = true;
    trackEvent("purchase", { path: `/orders/thank-you/${order.id}`, sku: order.sku });
  }, [order]);

  const totalKobo = order?.totalKobo ?? snapshot?.totalKobo ?? 0;
  // Prefer live paid; if bank still awaiting, use the amount just submitted
  const bookedPaid = order?.paidKobo ?? 0;
  const submittedPaid = snapshot?.paidTowardKobo ?? 0;
  const displayPaid =
    bookedPaid > 0 ? bookedPaid : snapshot?.awaitingBank ? submittedPaid : Math.max(bookedPaid, submittedPaid);
  const balanceKobo = Math.max(0, totalKobo - displayPaid);
  const paidPct = pctOf(displayPaid, totalKobo);
  const balancePct = totalKobo > 0 ? Math.max(0, 100 - paidPct) : 0;
  const paidInFull = totalKobo > 0 && balanceKobo <= 0 && displayPaid > 0;
  const isDeposit = snapshot?.payMode === "deposit" || (displayPaid > 0 && !paidInFull && paidPct >= 70 && paidPct < 100);

  return (
    <>
      <PageHero title="Thank you" crumb="Order" />
      <section className="mx-auto max-w-xl px-6 py-16 text-center">
        <AsyncGuard loading={loading} error={error}>
          <h2 className="font-alt text-3xl text-ink">We have your order.</h2>
          {order ? (
            <>
              <p className="mt-4 text-ink">
                Order #{order.number} · total {formatNaira(totalKobo)}
              </p>

              {totalKobo > 0 && displayPaid > 0 ? (
                <div className="mt-6 space-y-3 rounded-2xl border border-line bg-paper px-5 py-5 text-left text-sm">
                  {snapshot?.awaitingBank && bookedPaid <= 0 ? (
                    <p className="text-amber-800">
                      Bank transfer submitted — waiting for house confirmation before it counts as paid.
                    </p>
                  ) : null}
                  <p>
                    <span className="font-medium text-emerald-800">
                      {paidInFull ? "Paid in full" : isDeposit ? "Deposit paid" : "Amount paid"}: {formatNaira(displayPaid)}
                    </span>
                    <span className="ml-2 font-medium text-emerald-800">({paidPct}%)</span>
                  </p>
                  {paidInFull ? (
                    <p className="font-medium text-emerald-800">Balance left: {formatNaira(0)} (0%)</p>
                  ) : (
                    <p>
                      <span className="font-medium text-amber-800">
                        Balance left: {formatNaira(balanceKobo)}
                      </span>
                      <span className="ml-2 font-medium text-amber-800">({balancePct}%)</span>
                      <span className="mt-1 block text-muted">Due before delivery.</span>
                    </p>
                  )}
                  {isDeposit && !paidInFull ? (
                    <p className="text-xs text-muted">
                      You chose the minimum payment path
                      {snapshot?.depositKobo
                        ? ` (about ${pctOf(snapshot.depositKobo, totalKobo)}% now)`
                        : " (70% now)"}
                      . Pay the rest from Account → Payments when ready.
                    </p>
                  ) : null}
                </div>
              ) : (
                <p className="mt-2 text-sm">
                  {order.status === "awaiting_transfer"
                    ? "Order confirmation emailed. Your bank transfer is waiting for payment confirmation from the house."
                    : order.status === "pending_payment"
                      ? "Complete payment from your account if you have not already."
                      : order.priceOnRequest && totalKobo <= 0
                        ? "Request for price placed — the house will send a quote."
                        : "We have recorded your order."}
                </p>
              )}

              {balanceKobo > 0 && totalKobo > 0 ? (
                <Link to="/account/payments" className="mt-4 inline-block text-amber-900 underline">
                  Pay remaining balance ({balancePct}%)
                </Link>
              ) : null}
            </>
          ) : (
            <p className="mt-4">We could not find that order in this browser.</p>
          )}
          {welcome || user ? (
            <div className="mt-8 rounded-2xl border border-line bg-paper p-5 text-left text-sm">
              <p className="font-medium text-ink">Your client book</p>
              <p className="mt-2">Email: {welcome?.email ?? user?.email}</p>
              <p className="mt-2">
                Check your email for sign-in details if this was your first order, or open Account anytime.
              </p>
            </div>
          ) : null}
          <div className="mt-8 flex justify-center gap-4">
            <Link to="/shop" className="bg-ink px-6 py-3 text-white">
              Shop
            </Link>
            <Link to="/account" className="border border-ink px-6 py-3 text-ink">
              Account
            </Link>
            <Link to="/account/profile" className="border border-gold px-6 py-3 text-ink">
              Change password
            </Link>
          </div>
        </AsyncGuard>
      </section>
    </>
  );
}
