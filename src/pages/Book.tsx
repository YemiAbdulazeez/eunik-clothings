import { type FormEvent, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import PageHero from "@/components/PageHero";
import StaffShopGuard from "@/components/StaffShopGuard";
import { db } from "@/db/database";
import { useAsync } from "@/hooks/useAsync";
import { trackEvent } from "@/lib/track";

export default function Book() {
  const [busy, setBusy] = useState(false);
  const [reference, setReference] = useState<string | null>(null);
  const [params] = useSearchParams();
  const eventSlug = params.get("event");
  const { data: event } = useAsync(
    () => (eventSlug ? db.content.eventBySlug(eventSlug) : Promise.resolve(null)),
    [eventSlug],
  );

  async function submit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    const data = new FormData(formEvent.currentTarget);
    setBusy(true);
    try {
      const notes = [String(data.get("notes") ?? ""), event ? `Event: ${event.name}` : ""].filter(Boolean).join(" · ");
      const row = await db.appointments.create({
        customerName: String(data.get("name") ?? ""),
        service: String(data.get("service") ?? "Consultation"),
        date: String(data.get("date") ?? ""),
        time: String(data.get("time") ?? ""),
        location: "Eunik HQ, Ibadan",
        notes,
      });
      setReference(row.id.slice(0, 8).toUpperCase());
      trackEvent("book_submit");
      toast.success("Requested. Desk will confirm.");
      formEvent.currentTarget.reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not book.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <StaffShopGuard>
      <PageHero title="Book the house" crumb="Book" />
      <section className="mx-auto max-w-xl px-6 py-12">
        {event ? (
          <p className="mb-6 rounded-2xl border border-line bg-paper px-4 py-3 text-sm">
            Booking for <span className="font-medium text-ink">{event.name}</span> · {event.date} · {event.location}
          </p>
        ) : null}
        {reference ? (
          <div className="mb-6 rounded-2xl border border-gold/40 bg-paper px-4 py-4 text-sm">
            <p className="font-medium text-ink">Request received</p>
            <p className="mt-1">Reference <span className="font-mono">{reference}</span> — desk will confirm by phone or email.</p>
            <Link to="/track" className="mt-2 inline-block underline">
              Track an order
            </Link>
          </div>
        ) : null}
        <form onSubmit={(event) => void submit(event)} className="space-y-4">
          <label className="block">
            <span className="os-label">Name</span>
            <input name="name" required className="mt-1 w-full border border-line px-3 py-2 text-ink" />
          </label>
          <label className="block">
            <span className="os-label">Service</span>
            <select name="service" className="mt-1 w-full border border-line px-3 py-2 text-ink">
              <option>Consultation</option>
              <option>Measurement</option>
              <option>Fitting</option>
            </select>
          </label>
          <label className="block">
            <span className="os-label">Date</span>
            <input name="date" type="date" required className="mt-1 w-full border border-line px-3 py-2 text-ink" />
          </label>
          <label className="block">
            <span className="os-label">Time</span>
            <input name="time" type="time" required className="mt-1 w-full border border-line px-3 py-2 text-ink" />
          </label>
          <label className="block">
            <span className="os-label">Notes</span>
            <textarea name="notes" className="mt-1 w-full border border-line px-3 py-2 text-ink" />
          </label>
          <button disabled={busy} className="os-pill bg-ink text-white">
            Request appointment
          </button>
        </form>
      </section>
    </StaffShopGuard>
  );
}
