import { type FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { Copy, MapPin, PackageSearch, Search } from "lucide-react";
import { toast } from "sonner";
import PageHero from "@/components/PageHero";
import OrderStepper, { trackingHeadline } from "@/components/os/OrderStepper";
import { db } from "@/db/database";
import type { OrderStatus, ProductionStage } from "@/db/types";
import { statusLabel } from "@/lib/format";

export default function TrackOrder() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<Awaited<ReturnType<typeof db.orders.trackPublic>>>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const number = String(new FormData(event.currentTarget).get("number") ?? "");
    setBusy(true);
    setError("");
    try {
      const found = await db.orders.trackPublic(number);
      setResult(found);
      if (!found) setError("No order matches that number. Check the receipt or WhatsApp confirmation.");
    } catch (cause) {
      setResult(null);
      setError(cause instanceof Error ? cause.message : "Could not look up that order.");
    } finally {
      setBusy(false);
    }
  }

  function copyNumber() {
    if (!result?.number) return;
    void navigator.clipboard.writeText(result.number).then(
      () => toast.success("Order number copied."),
      () => toast.error("Could not copy."),
    );
  }

  const headline = result
    ? trackingHeadline(result.status as OrderStatus, result.stage as ProductionStage | null, result.kind)
    : null;

  return (
    <>
      <PageHero title="Track an order" crumb="Track" />
      <section className="mx-auto max-w-lg px-6 py-10 sm:max-w-xl">
        <form onSubmit={(event) => void submit(event)} className="mb-8">
          <label className="os-label mb-2 block" htmlFor="track-number">
            Order number
          </label>
          <div className="flex overflow-hidden rounded-full border border-line bg-white shadow-sm focus-within:border-ink">
            <span className="flex items-center pl-4 text-muted">
              <Search className="h-4 w-4" />
            </span>
            <input
              id="track-number"
              name="number"
              required
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="e.g. ORD-000123"
              className="min-w-0 flex-1 border-0 bg-transparent px-3 py-3.5 text-ink outline-none placeholder:text-muted/70"
            />
            <button
              disabled={busy}
              type="submit"
              className="m-1 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
            >
              {busy ? "…" : "Track"}
            </button>
          </div>
          <p className="mt-2 text-sm text-muted">From your receipt, email, or bank transfer narration.</p>
        </form>

        {error ? (
          <div className="mb-6 flex gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <PackageSearch className="mt-0.5 h-5 w-5 shrink-0" />
            <p>{error}</p>
          </div>
        ) : null}

        {result && headline ? (
          <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
            <div className="bg-gradient-to-br from-ink via-ink to-nero px-5 py-6 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">Live status</p>
              <h2 className="mt-2 font-alt text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
                {headline.title}
              </h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-white/75">{headline.detail}</p>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-white/80">
                <MapPin className="h-4 w-4 text-gold" />
                <span>{statusLabel(result.fulfillment)}</span>
                <span className="text-white/40">·</span>
                <span className="capitalize">{statusLabel(result.kind)}</span>
                {"priceOnRequest" in result && result.priceOnRequest ? (
                  <>
                    <span className="text-white/40">·</span>
                    <span className="rounded-full bg-gold/30 px-2 py-0.5 text-[11px] uppercase tracking-wide text-gold">
                      Request for price
                    </span>
                  </>
                ) : null}
              </div>
            </div>

            <div className="flex gap-4 border-b border-line px-5 py-4">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-paper">
                {result.image ? (
                  <img src={result.image} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted">
                    <PackageSearch className="h-7 w-7" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-ink">{result.name}</p>
                <button
                  type="button"
                  onClick={copyNumber}
                  className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"
                >
                  #{result.number}
                  <Copy className="h-3.5 w-3.5" />
                </button>
                {result.customerName ? (
                  <p className="mt-1 truncate text-sm text-muted">For {result.customerName}</p>
                ) : null}
              </div>
            </div>

            <div className="px-5 py-5">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-muted">Logistics</p>
              <OrderStepper
                key={`${result.status}-${result.stage ?? "none"}-${result.number}`}
                status={result.status as OrderStatus}
                stage={result.stage as ProductionStage | null}
                kind={result.kind}
                createdAt={result.createdAt}
              />
            </div>

            <div className="border-t border-line bg-paper/60 px-5 py-4 text-center text-sm text-muted">
              Need help?{" "}
              <Link to="/contact" className="font-medium text-ink underline underline-offset-2">
                Contact the house
              </Link>
            </div>
          </div>
        ) : null}
      </section>
    </>
  );
}
