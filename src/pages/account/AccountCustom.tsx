import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import DocumentSheet from "@/components/DocumentSheet";
import { EmptyState, Field, OsButton, PageHeader, SectionCard, StatusBadge, inputClass } from "@/components/os/ui";
import { db } from "@/db/database";
import { useAsync } from "@/hooks/useAsync";
import { formatNaira } from "@/lib/money";
import { statusLabel, statusTone } from "@/lib/format";
import { useSession } from "@/context/SessionProvider";

export default function AccountCustom() {
  const { user } = useSession();
  const navigate = useNavigate();
  const { data: requests, reload: reloadRequests } = useAsync(() => db.customDesigns.listMine(), []);
  const { data: quotes, reload: reloadQuotes } = useAsync(() => db.quotations.listMine(), []);
  const { data: settings } = useAsync(() => db.settings.get(), []);
  const [open, setOpen] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy("create");
    try {
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
      reloadRequests();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send request.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Custom designs"
        subtitle="Send a custom request. When we quote, review the document, then accept or decline."
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
              <OsButton type="submit" loading={busy === "create"} loadingText="Sending…">
                Send request
              </OsButton>
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
            <SectionCard key={item.id} title={`${item.outfitType} · ${item.colour}`} action={<StatusBadge label={statusLabel(item.status)} tone={statusTone(item.status)} />}>
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
            <div key={item.id} className="rounded-xl border border-line px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-ink">
                    {item.number} · {formatNaira(item.totalKobo)}
                  </p>
                  <p className="text-sm">{item.description}</p>
                  <StatusBadge label={statusLabel(item.status)} tone={statusTone(item.status)} />
                </div>
                <div className="flex flex-wrap gap-2">
                  <OsButton variant="ghost" onClick={() => setPreviewId(previewId === item.id ? null : item.id)}>
                    {previewId === item.id ? "Hide document" : "View document"}
                  </OsButton>
                  {item.status === "sent" ? (
                    <>
                      <OsButton
                        variant="gold"
                        loading={busy === `accept-${item.id}`}
                        loadingText="Accepting…"
                        onClick={() => {
                          setBusy(`accept-${item.id}`);
                          void db.quotations
                            .accept(item.id)
                            .then((order) => {
                              toast.success(`Accepted — pay #${order.number}`);
                              navigate("/account/payments");
                            })
                            .catch((error) => toast.error(error instanceof Error ? error.message : "Could not accept."))
                            .finally(() => setBusy(null));
                        }}
                      >
                        Accept
                      </OsButton>
                      <OsButton
                        variant="ghost"
                        loading={busy === `reject-${item.id}`}
                        loadingText="Declining…"
                        onClick={() => {
                          setBusy(`reject-${item.id}`);
                          void db.quotations
                            .reject(item.id)
                            .then(() => {
                              toast.success("Quote declined.");
                              reloadQuotes();
                            })
                            .catch((error) => toast.error(error instanceof Error ? error.message : "Could not decline."))
                            .finally(() => setBusy(null));
                        }}
                      >
                        Decline
                      </OsButton>
                    </>
                  ) : null}
                </div>
              </div>
              {previewId === item.id ? (
                <div className="mt-4 overflow-auto">
                  <DocumentSheet
                    data={{
                      variant: "quote",
                      number: item.number,
                      issuedAt: item.createdAt,
                      billTo: user?.name ?? "Client",
                      payableTo: settings?.company ?? "EUNIK CLOTHINGS",
                      lines: [{ description: item.description, quantity: 1, unitKobo: item.totalKobo }],
                      depositKobo: item.depositKobo,
                      bank: settings?.bank
                        ? {
                            bankName: settings.bank.bankName,
                            accountName: settings.bank.accountName,
                            accountNumber: settings.bank.accountNumber,
                          }
                        : undefined,
                      house: settings
                        ? { name: settings.company, address: settings.address, phone: settings.phone }
                        : undefined,
                    }}
                  />
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
