import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import PageHero from "@/components/PageHero";
import StaffShopGuard from "@/components/StaffShopGuard";
import { useSession } from "@/context/SessionProvider";
import { db } from "@/db/database";

export default function Bespoke() {
  const { user } = useSession();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) {
      navigate("/account/login?next=/bespoke");
      return;
    }
    const data = new FormData(event.currentTarget);
    setBusy(true);
    try {
      await db.customDesigns.create({
        outfitType: String(data.get("outfit") ?? "Agbada"),
        occasion: String(data.get("occasion") ?? ""),
        colour: String(data.get("colour") ?? ""),
        budget: String(data.get("budget") ?? ""),
        deliveryDate: String(data.get("delivery") ?? ""),
        description: String(data.get("description") ?? ""),
        consultation: String(data.get("consultation") ?? "Ibadan HQ"),
      });
      toast.success("Request received. Desk will quote.");
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
        <form onSubmit={(event) => void submit(event)} className="mt-8 space-y-4">
          <label className="block">
            <span className="os-label">Outfit</span>
            <select name="outfit" className="mt-1 w-full border border-line px-3 py-2 text-ink">
              <option>Agbada</option>
              <option>Senator</option>
              <option>Ara'nbada</option>
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
            <textarea name="description" rows={4} className="mt-1 w-full border border-line px-3 py-2 text-ink" />
          </label>
          <button disabled={busy} className="os-pill bg-ink text-white">
            Send request
          </button>
        </form>
      </section>
    </StaffShopGuard>
  );
}
