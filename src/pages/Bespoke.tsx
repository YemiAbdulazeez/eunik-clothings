import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import LoadingButton from "@/components/LoadingButton";
import PageHero from "@/components/PageHero";
import StaffShopGuard from "@/components/StaffShopGuard";
import { useSession } from "@/context/SessionProvider";
import { db } from "@/db/database";
import { HTTP_ENABLED, httpCustom } from "@/api/http";
import { setAuthTokens } from "@/api/tokenStore";

export default function Bespoke() {
  const { user, refresh } = useSession();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [agreedPolicies, setAgreedPolicies] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user && !agreedPolicies) {
      toast.error("Please agree to the house policies before sending.");
      return;
    }
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? user?.name ?? "").trim();
    const email = String(data.get("email") ?? user?.email ?? "").trim();
    const phone = String(data.get("phone") ?? user?.phone ?? "").trim();
    if (!user && (!name || !email)) {
      toast.error("Enter your name and email so we can open your client book.");
      return;
    }
    setBusy(true);
    try {
      const payload = {
        outfitType: String(data.get("outfit") ?? "Agbada"),
        occasion: String(data.get("occasion") ?? ""),
        colour: String(data.get("colour") ?? ""),
        budget: String(data.get("budget") ?? ""),
        deliveryDate: String(data.get("delivery") ?? ""),
        description: String(data.get("description") ?? ""),
        consultation: String(data.get("consultation") ?? "Ibadan HQ"),
      };
      if (HTTP_ENABLED) {
        const created = await httpCustom.create({
          ...payload,
          ...(user
            ? {}
            : {
                name,
                email,
                phone: phone || undefined,
                agreedPolicies,
              }),
        });
        if ("needsLogin" in created && created.needsLogin) {
          toast.message("That email already has a client book. Sign in to continue.");
          navigate(`/account/login?next=/bespoke&email=${encodeURIComponent(String(created.email ?? email))}`);
          return;
        }
        if (created.accessToken) {
          setAuthTokens(
            { access: String(created.accessToken), refresh: created.refreshToken ? String(created.refreshToken) : undefined },
            { remember: false },
          );
          await refresh();
          toast.message("We emailed your temporary password — it stays valid until you change it from Profile.");
        }
      } else {
        if (!user) {
          navigate("/account/login?next=/bespoke");
          return;
        }
        await db.customDesigns.create(payload);
      }
      toast.success("Request received — confirmation emailed. Desk will quote.");
      navigate("/account/custom");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send the request.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <StaffShopGuard>
      <PageHero title="Bespoke" crumb="Bespoke" />
      <section className="mx-auto max-w-xl px-6 py-12">
        <h2 className="font-alt text-3xl text-ink">Tell the house what to cut.</h2>
        <p className="mt-2">We quote in naira, then you accept and pay a deposit — Paystack or transfer.</p>
        {user ? (
          <p className="mt-2 text-sm">Signed in as {user.email}</p>
        ) : (
          <p className="mt-2 rounded-xl border border-line bg-paper/60 px-3 py-2 text-sm text-muted">
            No account needed. We will open a client book with your email and send temporary sign-in details.
          </p>
        )}
        <form onSubmit={(event) => void submit(event)} className="mt-8 space-y-4">
          {!user ? (
            <>
              <label className="block">
                <span className="os-label">Full name</span>
                <input name="name" required className="mt-1 w-full border border-line px-3 py-2 text-ink" />
              </label>
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
            <span className="os-label">Outfit</span>
            <select name="outfit" className="mt-1 w-full border border-line px-3 py-2 text-ink">
              <option>Agbada</option>
              <option>Senator</option>
              <option>Ara&apos;nbada</option>
              <option>Esiki</option>
              <option>Suit</option>
            </select>
          </label>
          <label className="block">
            <span className="os-label">Occasion</span>
            <input name="occasion" required className="mt-1 w-full border border-line px-3 py-2 text-ink" />
          </label>
          <label className="block">
            <span className="os-label">Colour</span>
            <input name="colour" required className="mt-1 w-full border border-line px-3 py-2 text-ink" />
          </label>
          <label className="block">
            <span className="os-label">Budget</span>
            <input name="budget" placeholder="₦" className="mt-1 w-full border border-line px-3 py-2 text-ink" />
          </label>
          <label className="block">
            <span className="os-label">Needed by</span>
            <input name="delivery" type="date" className="mt-1 w-full border border-line px-3 py-2 text-ink" />
          </label>
          <label className="block">
            <span className="os-label">Notes</span>
            <textarea name="description" rows={4} required className="mt-1 w-full border border-line px-3 py-2 text-ink" />
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
          <LoadingButton type="submit" loading={busy} loadingText="Sending…" disabled={!user && !agreedPolicies}>
            Send request
          </LoadingButton>
        </form>
      </section>
    </StaffShopGuard>
  );
}
