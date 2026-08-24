import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import QuoteComposer from "@/components/QuoteComposer";
import { PageHeader, PageLoading, SectionCard, StatusBadge, OsButton } from "@/components/os/ui";
import { db } from "@/db/database";
import { useAsync } from "@/hooks/useAsync";
import { formatNaira } from "@/lib/money";
import { statusLabel, statusTone } from "@/lib/format";

export default function StudioCustom() {
  const { data: requests, reload, loading } = useAsync(() => db.customDesigns.listAll(), []);
  const { data: quotes, reload: reloadQuotes } = useAsync(() => db.quotations.listAll(), []);
  const { data: settings } = useAsync(() => db.settings.get(), []);
  const [composing, setComposing] = useState<string | null>(null);
  const [revising, setRevising] = useState<string | null>(null);

  if (loading && !requests) return <PageLoading />;

  const bank = settings?.bank
    ? {
        bankName: settings.bank.bankName,
        accountName: settings.bank.accountName,
        accountNumber: settings.bank.accountNumber,
      }
    : undefined;
  const house = settings
    ? {
        name: settings.company,
        address: settings.address,
        phone: settings.phone,
      }
    : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Custom requests"
        subtitle="Edit the document, preview, then send. Clients accept in their book."
        onRefresh={() => Promise.all([reload(), reloadQuotes()])}
      />
      {(requests ?? []).map((item) => {
        const quote = (quotes ?? []).find((entry) => entry.requestId === item.id);
        const customerName = item.customerName ?? "Client";

        return (
          <SectionCard
            key={item.id}
            title={`${item.outfitType} · ${item.colour}`}
            action={<StatusBadge label={statusLabel(item.status)} tone={statusTone(item.status)} />}
          >
            <p>{item.description}</p>
            <p className="mt-1 text-sm">
              Budget {item.budget} · {item.occasion} · {item.consultation}
            </p>
            {quote ? (
              <div className="mt-3 rounded-xl border border-line px-4 py-3 text-sm">
                <p className="font-medium text-ink">
                  {quote.number} · {formatNaira(quote.totalKobo)} · deposit {formatNaira(quote.depositKobo)}
                </p>
                <p className="mt-1 text-muted">{quote.description}</p>
                <StatusBadge label={statusLabel(quote.status)} tone={statusTone(quote.status)} />
                <div className="mt-2 flex flex-wrap gap-2">
                  <Link to="/studio/quotes" className="text-xs underline hover:text-ink">
                    Open quotes file
                  </Link>
                  {quote.status === "sent" ? (
                    <button
                      type="button"
                      className="text-xs underline hover:text-ink"
                      onClick={() => setRevising(revising === quote.id ? null : quote.id)}
                    >
                      {revising === quote.id ? "Close editor" : "Revise document"}
                    </button>
                  ) : null}
                </div>
                {revising === quote.id && quote.status === "sent" ? (
                  <div className="mt-4">
                    <QuoteComposer
                      submitLabel="Revise & re-send"
                      loadingText="Updating…"
                      bank={bank}
                      house={house}
                      initial={{
                        billTo: customerName,
                        payableTo: settings?.company ?? "EUNIK CLOTHINGS",
                        number: quote.number,
                        issuedAt: new Date().toISOString().slice(0, 10),
                        lines: [{ description: quote.description, quantity: 1, unitKobo: quote.totalKobo }],
                        depositNaira: quote.depositKobo / 100,
                        note: "Revised quotation — deposit confirms the atelier slot.",
                        variant: "quote",
                      }}
                      onSubmit={async ({ description, totalKobo, depositKobo }) => {
                        await db.quotations.revise(quote.id, { description, totalKobo, depositKobo });
                        toast.success("Quote revised and re-sent.");
                        setRevising(null);
                        reload();
                        reloadQuotes();
                      }}
                    />
                  </div>
                ) : null}
              </div>
            ) : null}
            {item.status === "new" ? (
              <div className="mt-4">
                {composing === item.id ? (
                  <QuoteComposer
                    bank={bank}
                    house={house}
                    initial={{
                      billTo: customerName,
                      payableTo: settings?.company ?? "EUNIK CLOTHINGS",
                      number: `DRAFT-${item.id.slice(0, 6).toUpperCase()}`,
                      issuedAt: new Date().toISOString().slice(0, 10),
                      lines: [
                        {
                          description: `${item.colour} ${item.outfitType}`,
                          quantity: 1,
                          unitKobo: 400000_00,
                        },
                      ],
                      depositNaira: 240000,
                      note: "Deposit confirms fabric and cutting. Balance due before collection.",
                      variant: "quote",
                    }}
                    onSubmit={async ({ description, totalKobo, depositKobo }) => {
                      const sent = await db.quotations.createFromRequest(item.id, {
                        description,
                        totalKobo,
                        depositKobo,
                        customerId: item.customerId,
                      });
                      toast.success(`Sent ${sent.number}`);
                      setComposing(null);
                      reload();
                      reloadQuotes();
                    }}
                  />
                ) : (
                  <OsButton variant="gold" onClick={() => setComposing(item.id)}>
                    Compose quote / invoice
                  </OsButton>
                )}
              </div>
            ) : item.status === "quoted" && !quote ? (
              <p className="mt-3 text-sm text-muted">Quoted — see the quotes file.</p>
            ) : null}
          </SectionCard>
        );
      })}
    </div>
  );
}
