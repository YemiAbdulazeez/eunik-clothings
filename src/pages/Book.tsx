import { type FormEvent, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import LoadingButton from "@/components/LoadingButton";
import PageHero from "@/components/PageHero";
import RequireClient from "@/components/RequireClient";
import { useSession } from "@/context/SessionProvider";
import { db } from "@/db/database";
import { useAsync } from "@/hooks/useAsync";
import { trackEvent } from "@/lib/track";

export default function Book() {
  const { user } = useSession();
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
    if (!user) return;
    const data = new FormData(formEvent.currentTarget);
    setBusy(true);
    try {
      const notes = [String(data.get("notes") ?? ""), event ? `Event: ${event.name}` : ""].filter(Boolean).join(" · ");
      const row = await db.appointments.create({
        customerName: String(data.get("name") ?? user.name),
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
    <RequireClient>
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
            <p className="mt-1">
              Reference <span className="font-mono">{reference}</span> — desk will confirm by phone or email.
            </p>
            <Link to="/account/appointments" className="mt-2 inline-block underline hover:opacity-70">
              View my bookings
            </Link>
          </div>
        ) : null}
        <p className="mb-4 text-sm">Signed in as {user?.email}</p>
        <form onSubmit={(event) => void submit(event)} className="space-y-4">
          <label className="block">
            <span className="os-label">Name</span>
            <input
              name="name"
              required
              defaultValue={user?.name}
              className="mt-1 w-full border border-line px-3 py-2 text-ink"
            />
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
          <LoadingButton type="submit" loading={busy} loadingText="Requesting…">
            Request appointment
          </LoadingButton>
        </form>
      </section>
    </RequireClient>
  );
}
