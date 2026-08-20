import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { EmptyState, Field, OsButton, PageHeader, SectionCard, StatusBadge, inputClass } from "@/components/os/ui";
import { db } from "@/db/database";
import { useAsync } from "@/hooks/useAsync";
import { formatNaira } from "@/lib/money";
import { statusTone } from "@/lib/format";
import { useSession } from "@/context/SessionProvider";

export default function AccountCustom() {
  const { user } = useSession();
  const navigate = useNavigate();
  const { data: requests } = useAsync(() => db.customDesigns.listMine(), []);
  const { data: quotes } = useAsync(() => db.quotations.listMine(), []);
  const [open, setOpen] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    await db.customDesigns.create({
      outfitType: String(data.get("outfit") ?? "Agbada"),
      occasion: String(data.get("occasion") ?? ""),
      colour: String(data.get("colour") ?? ""),
      budget: String(data.get("budget") ?? ""),
      deliveryDate: String(data.get("delivery") ?? ""),
      description: String(data.get("description") ?? ""),
      consultation: "Ibadan HQ",
    });
    toast.success("Request received. Desk will quote.");
    event.currentTarget.reset();
    setOpen(false);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Custom designs"
        subtitle="Bespoke requests become quotes, then tickets — without leaving your book."
        actions={
          <OsButton variant="gold" onClick={() => setOpen(true)}>
            New request
          </OsButton>
        }
      />
      {open ? (
        <SectionCard title="Tell the house what to cut">
          <form onSubmit={(event) => void submit(event)} className="grid gap-3 md:grid-cols-2">
            <Field label="Outfit">
              <select name="outfit" className={inputClass}>
                <option>Agbada</option>
                <option>Senator</option>
                <option>Ara'nbada</option>
                <option>Esiki</option>
                <option>Suit</option>
              </select>
            </Field>
            <Field label="Occasion">
              <input name="occasion" required className={inputClass} />
            </Field>
            <Field label="Colour">
              <input name="colour" required className={inputClass} />
            </Field>
            <Field label="Budget">
              <input name="budget" placeholder="₦" className={inputClass} />
            </Field>
            <Field label="Needed by">
              <input name="delivery" type="date" className={inputClass} />
            </Field>
            <div className="md:col-span-2">
              <Field label="Notes">
                <textarea name="description" rows={3} className={inputClass} />
              </Field>
            </div>
            <div className="flex gap-2">
              <OsButton type="submit">Send request</OsButton>
              <OsButton variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </OsButton>
            </div>
          </form>
        </SectionCard>
      ) : null}
      {!requests?.length ? (
        <EmptyState title="No requests" text={`Ask from this page, ${user?.firstName ?? "client"}.`} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {(requests ?? []).map((item) => (
            <SectionCard key={item.id} title={`${item.outfitType} · ${item.colour}`} action={<StatusBadge label={item.status} tone={statusTone(item.status)} />}>
              <p className="text-sm">{item.description}</p>
              <p className="mt-2 text-xs">
                {item.occasion} · needed {item.deliveryDate || "open"} · {item.budget}
              </p>
            </SectionCard>
          ))}
        </div>
      )}
      <SectionCard title="Quotes">
        <div className="space-y-3">
          {(quotes ?? []).map((item) => (
            <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line px-4 py-3">
              <div>
                <p className="font-medium text-ink">
                  {item.number} · {formatNaira(item.totalKobo)}
                </p>
                <p className="text-sm">{item.description}</p>
                <StatusBadge label={item.status} tone={statusTone(item.status)} />
              </div>
              {item.status === "sent" ? (
                <div className="flex flex-wrap gap-2">
                  <OsButton
                    variant="gold"
                    onClick={() =>
                      void db.quotations.accept(item.id).then((order) => {
                        toast.success(`Accepted — pay #${order.number}`);
                        navigate("/account/payments");
                      })
                    }
                  >
                    Accept
                  </OsButton>
                  <OsButton
                    variant="ghost"
                    onClick={() =>
                      void db.quotations.reject(item.id).then(() => toast.success("Quote declined."))
                    }
                  >
                    Decline
                  </OsButton>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
