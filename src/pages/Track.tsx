import { type FormEvent, useState } from "react";
import { PackageSearch } from "lucide-react";
import PageHero from "@/components/PageHero";
import OrderStepper from "@/components/os/OrderStepper";
import { db } from "@/db/database";
import type { OrderStatus, ProductionStage } from "@/db/types";

export default function TrackOrder() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Awaited<ReturnType<typeof db.orders.trackPublic>>>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const number = String(new FormData(event.currentTarget).get("number") ?? "");
    setBusy(true);
    setError("");
    try {
      const found = await db.orders.trackPublic(number);
      setResult(found);
      if (!found) setError("No ticket matches that number. Try 1001 from the demo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHero title="Track an order" crumb="Track" />
      <section className="mx-auto max-w-2xl px-6 py-12">
        <div className="mb-8 flex items-start gap-3">
          <PackageSearch className="h-8 w-8 text-ink" />
          <div>
            <h2 className="font-alt text-3xl text-ink">Follow the floor without signing in.</h2>
            <p className="mt-2">Enter the order number from your receipt or WhatsApp. Demo: 1001.</p>
          </div>
        </div>
        <form onSubmit={(event) => void submit(event)} className="flex flex-col gap-3 sm:flex-row">
          <input
            name="number"
            required
            placeholder="Order number"
            className="flex-1 border border-line px-4 py-3 text-ink"
          />
          <button disabled={busy} className="os-pill bg-ink text-white">
            Track
          </button>
        </form>
        {error ? <p className="mt-4 text-sm text-[var(--destructive)]">{error}</p> : null}
        {result ? (
          <div className="mt-10 space-y-6 rounded-2xl border border-line bg-white p-6">
            {result.image ? <img src={result.image} alt="" className="h-48 w-full rounded-xl object-cover" /> : null}
            <div>
              <p className="os-label">#{result.number}</p>
              <h3 className="font-alt text-2xl text-ink">{result.name}</h3>
              <p className="mt-1 text-sm capitalize">
                {result.kind.replaceAll("_", " ")} · {result.fulfillment.replace("_", " ")} · {result.customerName}
              </p>
            </div>
            <OrderStepper
              status={result.status as OrderStatus}
              stage={result.stage as ProductionStage | null}
              kind={result.kind}
            />
            {result.stage ? (
              <p className="text-sm capitalize">Current atelier stage · {result.stage.replaceAll("_", " ")}</p>
            ) : (
              <p className="text-sm capitalize">Status · {result.status.replaceAll("_", " ")}</p>
            )}
          </div>
        ) : null}
      </section>
    </>
  );
}
