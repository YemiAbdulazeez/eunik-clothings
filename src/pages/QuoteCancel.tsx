import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import LoadingButton from "@/components/LoadingButton";
import PageHero from "@/components/PageHero";
import { PageSkeleton } from "@/components/Skeleton";
import { HTTP_ENABLED, httpRfpQuote } from "@/api/http";
import { useAsync } from "@/hooks/useAsync";

export default function QuoteCancelPage() {
  const { token = "" } = useParams();
  const { data, loading, error, reload } = useAsync(
    () => (HTTP_ENABLED ? httpRfpQuote.getCancel(token) : Promise.reject(new Error("API required for cancel links."))),
    [token],
  );
  const [busy, setBusy] = useState(false);

  async function confirmCancel() {
    setBusy(true);
    try {
      const result = await httpRfpQuote.cancel(token);
      toast.success(
        result.already ? `Order ${result.orderNumber} was already cancelled.` : `Order ${result.orderNumber} cancelled.`,
      );
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not cancel.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <>
        <PageHero title="Cancel order" crumb="Quote" />
        <PageSkeleton />
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <PageHero title="Cancel order" crumb="Quote" />
        <p className="mx-auto max-w-lg px-6 py-16 text-center">
          {typeof error === "string" ? error : "This cancel link is invalid or expired."}
        </p>
      </>
    );
  }

  return (
    <>
      <PageHero title="Cancel request for price" crumb="Quote" />
      <section className="mx-auto max-w-lg space-y-6 px-6 py-12 text-center">
        <p className="text-sm uppercase tracking-wide text-muted">Request for price</p>
        <h1 className="font-alt text-3xl text-ink">Order {data.orderNumber}</h1>
        {!data.canCancel ? (
          <p className="text-sm text-muted">
            {data.status === "cancelled"
              ? "This order is already cancelled."
              : "This order can no longer be cancelled from the link. Contact the house desk."}
          </p>
        ) : (
          <>
            <p className="text-sm text-muted">
              Cancel this request-for-price order? No payment will be taken.
            </p>
            <LoadingButton loading={busy} loadingText="Cancelling…" variant="ghost" onClick={() => void confirmCancel()}>
              Cancel order
            </LoadingButton>
          </>
        )}
        <Link to="/track" className="block text-sm underline">
          Track another order
        </Link>
      </section>
    </>
  );
}
