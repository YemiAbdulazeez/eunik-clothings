import { type FormEvent, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import LoadingButton from "@/components/LoadingButton";
import PageHero from "@/components/PageHero";
import StaffShopGuard from "@/components/StaffShopGuard";
import { useSession } from "@/context/SessionProvider";
import { db } from "@/db/database";
import { useAsync } from "@/hooks/useAsync";
import { trackEvent } from "@/lib/track";
import { HTTP_ENABLED, httpAppointments } from "@/api/http";
import { setAuthTokens } from "@/api/tokenStore";

export default function Book() {
  const { user, refresh } = useSession();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [agreedPolicies, setAgreedPolicies] = useState(false);
  const [reference, setReference] = useState<string | null>(null);
  const [params] = useSearchParams();
  const eventSlug = params.get("event");
  const { data: event } = useAsync(
    () => (eventSlug ? db.content.eventBySlug(eventSlug) : Promise.resolve(null)),
    [eventSlug],
  );

  async function submit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    if (!user && !agreedPolicies) {
      toast.error("Please agree to the house policies before booking.");
      return;
    }
    const data = new FormData(formEvent.currentTarget);
    const name = String(data.get("name") ?? user?.name ?? "").trim();
    const email = String(data.get("email") ?? user?.email ?? "").trim();
    const phone = String(data.get("phone") ?? user?.phone ?? "").trim();
    if (!name) {
      toast.error("Enter your name.");
      return;
    }
    if (!user && !email) {
      toast.error("Enter your email so we can open your client book.");
      return;
    }
    setBusy(true);
    try {
      const notes = [String(data.get("notes") ?? ""), event ? `Event: ${event.name}` : ""].filter(Boolean).join(" · ");
      if (HTTP_ENABLED) {
        const created = await httpAppointments.create({
          customerName: name,
          email: user ? undefined : email,
          phone: phone || undefined,
          service: String(data.get("service") ?? "Consultation"),
          date: String(data.get("date") ?? ""),
          time: String(data.get("time") ?? ""),
          location: "Eunik HQ, Ibadan",
          notes,
          agreedPolicies: !user ? agreedPolicies : undefined,
        });
        if ("needsLogin" in created && created.needsLogin) {
          toast.message("That email already has a client book. Sign in to continue.");
          navigate(`/account/login?next=/book&email=${encodeURIComponent(String(created.email ?? email))}`);
          return;
        }
        if (created.accessToken) {
          setAuthTokens(
            { access: created.accessToken, refresh: created.refreshToken },
            { remember: false },
          );
          await refresh();
          toast.message("We emailed your temporary password — it stays valid until you change it from Profile.");
        }
        setReference(created.reference ?? created.id.slice(0, 8).toUpperCase());
      } else {
        const row = await db.appointments.create({
          customerName: name,
          service: String(data.get("service") ?? "Consultation"),
          date: String(data.get("date") ?? ""),
          time: String(data.get("time") ?? ""),
          location: "Eunik HQ, Ibadan",
          notes,
        });
        setReference(row.id.slice(0, 8).toUpperCase());
      }
      trackEvent("book_submit");
      toast.success("Requested — confirmation emailed. Desk will confirm the slot.");
      formEvent.currentTarget.reset();
      setAgreedPolicies(false);
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
            <p className="mt-1">
              Reference <span className="font-mono">{reference}</span> — we emailed you and the house desk.
            </p>
            <Link to="/account/appointments" className="mt-2 inline-block underline hover:opacity-70">
              View my bookings
            </Link>
          </div>
        ) : null}
        {user ? (
          <p className="mb-4 text-sm">Signed in as {user.email}</p>
        ) : (
          <p className="mb-4 rounded-xl border border-line bg-paper/60 px-3 py-2 text-sm text-muted">
            No account needed. We will open a client book with your email and send temporary sign-in details.
          </p>
        )}
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
          {!user ? (
            <>
              <label className="block">
                <span className="os-label">Email</span>
                <input name="email" type="email" required className="mt-1 w-full border border-line px-3 py-2 text-ink" />
              </label>
              <label className="block">
                <span className="os-label">Phone</span>
                <input name="phone" required className="mt-1 w-full border border-line px-3 py-2 text-ink" />
              </label>
            </>
          ) : null}
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
          {!user ? (
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-paper/50 p-4 text-sm leading-6 text-ink">
              <input
                type="checkbox"
                required
                checked={agreedPolicies}
                onChange={(event) => setAgreedPolicies(event.target.checked)}
                className="mt-1 h-4 w-4 shrink-0 accent-ink"
              />
              <span>
                I agree to EUNIK’s{" "}
                <Link to="/policies/terms" className="underline" target="_blank" rel="noreferrer">
                  Terms &amp; Conditions
                </Link>
                ,{" "}
                <Link to="/policies/privacy" className="underline" target="_blank" rel="noreferrer">
                  Privacy Policy
                </Link>
                , and{" "}
                <Link to="/policies/ndpr" className="underline" target="_blank" rel="noreferrer">
                  NDPR Notice
                </Link>
                . A client book will be opened with my email.
              </span>
            </label>
          ) : null}
          <LoadingButton type="submit" loading={busy} loadingText="Requesting…" disabled={!user && !agreedPolicies}>
            Request appointment
          </LoadingButton>
        </form>
      </section>
    </StaffShopGuard>
  );
}
