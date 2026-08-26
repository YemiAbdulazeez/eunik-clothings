import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import PageHero from "@/components/PageHero";
import PayMethods, { type PayChoice } from "@/components/PayMethods";
import { PageSkeleton } from "@/components/Skeleton";
import { HTTP_ENABLED, httpBalancePay } from "@/api/http";
import { useAsync } from "@/hooks/useAsync";
import { formatNaira } from "@/lib/money";
import { openPaystackCheckout } from "@/lib/paystack";

export default function BalancePayPage() {
  const { token = "" } = useParams();
  const navigate = useNavigate();
  const { data, loading, error } = useAsync(
    () =>
      HTTP_ENABLED
        ? httpBalancePay.get(token)
        : Promise.reject(new Error("API required for balance pay links.")),
    [token],
  );
  const [busy, setBusy] = useState(false);

  async function pay(choice: PayChoice) {
    if (!data || data.settled || data.amountDueKobo <= 0) return;
    setBusy(true);
    try {
      if (choice.method === "paystack") {
        const init = await httpBalancePay.paystack(token);
        await openPaystackCheckout({
          orderId: init.orderId,
          email: data.order.customerEmail,
          amountKobo: init.amountKobo,
          type: "balance",
          accessCode: init.accessCode,
          reference: init.reference,
          verifyWithBalanceToken: token,
        });
        toast.success("Balance payment recorded.");
        try {
          sessionStorage.setItem(
            `eunik-thanks-${init.orderId}`,
            JSON.stringify({
              totalKobo: data.order.totalKobo,
              depositKobo: data.order.depositKobo,
              paidTowardKobo: init.amountKobo,
              payMode: "balance",
              method: "paystack",
              awaitingBank: false,
            }),
          );
        } catch {
          /* ignore */
        }
        navigate(`/orders/thank-you/${init.orderId}`);
      } else {
        const result = await httpBalancePay.transfer(token, {
          transactionNumber: choice.transactionNumber,
          receiptUrl: choice.receiptUrl,
        });
        toast.success("Transfer submitted — waiting for house confirmation.");
        try {
          sessionStorage.setItem(
            `eunik-thanks-${result.orderId}`,
            JSON.stringify({
              totalKobo: data.order.totalKobo,
              depositKobo: data.order.depositKobo,
              paidTowardKobo: data.amountDueKobo,
              payMode: "balance",
              method: "bank_transfer",
              awaitingBank: true,
            }),
          );
        } catch {
          /* ignore */
        }
        navigate(`/orders/thank-you/${result.orderId}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Payment failed.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <>
        <PageHero title="Pay balance" crumb="Orders" />
        <PageSkeleton />
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <PageHero title="Pay balance" crumb="Orders" />
        <p className="mx-auto max-w-lg px-6 py-16 text-center text-ink">
          {typeof error === "string" ? error : "This balance pay link is invalid or expired."}
        </p>
      </>
    );
  }

  if (data.settled || data.amountDueKobo <= 0) {
    return (
      <>
        <PageHero title="Pay balance" crumb="Orders" />
        <div className="mx-auto max-w-lg px-6 py-16 text-center">
          <h1 className="font-alt text-3xl text-ink">Already settled</h1>
          <p className="mt-2 text-muted">Order {data.order.number} has no outstanding balance.</p>
          <Link to="/account/orders" className="mt-6 inline-block underline">
            View your orders
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHero title="Pay balance" crumb="Orders" />
      <section className="mx-auto grid max-w-3xl gap-8 px-6 py-10 lg:grid-cols-2">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-wide text-muted">Outstanding balance</p>
          <h1 className="font-alt text-3xl text-ink">{data.order.name}</h1>
          <p className="text-sm text-muted">Order {data.order.number}</p>
          <p className="font-medium text-ink">Due now {formatNaira(data.amountDueKobo)}</p>
          <p className="text-sm text-muted">
            Paid so far {formatNaira(data.order.paidKobo)} of {formatNaira(data.order.totalKobo)}
          </p>
          <Link to="/track" className="inline-block text-sm underline">
            Track order
          </Link>
        </div>
        <PayMethods amountKobo={data.amountDueKobo} busy={busy} onPay={pay} />
      </section>
    </>
  );
}
