import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import PageHero from "@/components/PageHero";
import PayMethods, { type PayChoice } from "@/components/PayMethods";
import { PageSkeleton } from "@/components/Skeleton";
import { HTTP_ENABLED, httpRfpQuote } from "@/api/http";
import { useAsync } from "@/hooks/useAsync";
import { formatNaira } from "@/lib/money";
import { openPaystackCheckout } from "@/lib/paystack";

export default function QuotePayPage() {
  const { token = "" } = useParams();
  const navigate = useNavigate();
  const { data, loading, error } = useAsync(
    () => (HTTP_ENABLED ? httpRfpQuote.getPay(token) : Promise.reject(new Error("API required for quote pay links."))),
    [token],
  );
  const [busy, setBusy] = useState(false);
  const [payMode, setPayMode] = useState<"deposit" | "full">("deposit");

  async function pay(choice: PayChoice) {
    if (!data) return;
    setBusy(true);
    try {
      const type = payMode === "deposit" && data.depositDueKobo < data.amountDueKobo ? "deposit" : "full";
      if (choice.method === "paystack") {
        const init = await httpRfpQuote.paystack(token, type);
        await openPaystackCheckout({
          orderId: init.orderId,
          email: data.order.customerEmail,
          amountKobo: init.amountKobo,
          type,
          accessCode: init.accessCode,
          reference: init.reference,
          verifyWithToken: token,
        });
        toast.success(type === "deposit" ? "Minimum payment recorded — balance due before delivery." : "Payment recorded.");
        try {
          sessionStorage.setItem(
            `eunik-thanks-${init.orderId}`,
            JSON.stringify({
              totalKobo: data.order.totalKobo,
              depositKobo: data.order.depositKobo,
              paidTowardKobo: init.amountKobo,
              payMode: type,
              method: "paystack",
              awaitingBank: false,
            }),
          );
        } catch {
          /* ignore */
        }
        navigate(`/orders/thank-you/${init.orderId}`);
      } else {
        const result = await httpRfpQuote.transfer(token, {
          transactionNumber: choice.transactionNumber,
          receiptUrl: choice.receiptUrl,
          type,
        });
        toast.success("Transfer submitted — waiting for house confirmation.");
        try {
          const amount =
            type === "deposit" && data.depositDueKobo < data.amountDueKobo
              ? data.depositDueKobo
              : data.amountDueKobo;
          sessionStorage.setItem(
            `eunik-thanks-${result.orderId}`,
            JSON.stringify({
              totalKobo: data.order.totalKobo,
              depositKobo: data.order.depositKobo,
              paidTowardKobo: amount,
              payMode: type,
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
      toast.error(err instanceof Error ? err.message : "Could not pay.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <>
        <PageHero title="Pay quote" crumb="Quote" />
        <PageSkeleton />
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <PageHero title="Pay quote" crumb="Quote" />
        <p className="mx-auto max-w-lg px-6 py-16 text-center text-ink">
          {typeof error === "string" ? error : "This pay link is invalid or expired."}
        </p>
      </>
    );
  }

  const canSplit = data.depositDueKobo > 0 && data.depositDueKobo < data.amountDueKobo;
  const amount = payMode === "deposit" && canSplit ? data.depositDueKobo : data.amountDueKobo;
  const balanceLater = Math.max(0, data.amountDueKobo - (canSplit ? data.depositDueKobo : data.amountDueKobo));

  return (
    <>
      <PageHero title="Request for price" crumb="Quote" />
      <section className="mx-auto grid max-w-3xl gap-8 px-6 py-10 lg:grid-cols-2">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-wide text-muted">Request for price</p>
          <h1 className="font-alt text-3xl text-ink">{data.order.name}</h1>
          <p className="text-sm text-muted">
            Order {data.order.number} · Quote {data.quote.number}
          </p>
          <p className="text-lg text-ink">{data.quote.description}</p>
          <p className="font-medium text-ink">Order total {formatNaira(data.order.totalKobo)}</p>
          <p className="text-sm text-muted">
            Already paid {formatNaira(data.order.paidKobo)} · due now {formatNaira(amount)}
            {balanceLater > 0 ? ` · balance later ${formatNaira(balanceLater)}` : ""}
          </p>
          <Link to="/track" className="inline-block text-sm underline">
            Track order
          </Link>
        </div>
        <div className="space-y-4">
          {data.amountDueKobo <= 0 ? (
            <p className="rounded-xl border border-line p-4 text-sm">This order is already paid. Thank you.</p>
          ) : (
            <>
              {canSplit ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setPayMode("deposit")}
                    className={`rounded-2xl border p-3 text-left text-sm ${payMode === "deposit" ? "border-ink bg-paper" : "border-line"}`}
                  >
                    <p className="font-medium text-ink">Pay minimum now</p>
                    <p className="text-muted">{formatNaira(data.depositDueKobo)}</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayMode("full")}
                    className={`rounded-2xl border p-3 text-left text-sm ${payMode === "full" ? "border-ink bg-paper" : "border-line"}`}
                  >
                    <p className="font-medium text-ink">Pay remaining in full</p>
                    <p className="text-muted">{formatNaira(data.amountDueKobo)}</p>
                  </button>
                </div>
              ) : null}
              <PayMethods amountKobo={amount} busy={busy} onPay={pay} />
            </>
          )}
        </div>
      </section>
    </>
  );
}
