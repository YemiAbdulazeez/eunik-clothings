import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { PageHeader, SectionCard, StatusBadge, OsButton, Field, inputClass } from "@/components/os/ui";
import { db } from "@/db/database";
import { useAsync } from "@/hooks/useAsync";
import { nairaToKobo, formatNaira } from "@/lib/money";
import { statusLabel, statusTone } from "@/lib/format";

function ReviseQuoteForm({
  quoteId,
  defaults,
  onDone,
}: {
  quoteId: string;
  defaults: { description: string; totalKobo: number; depositKobo: number };
  onDone: () => void;
}) {
  return (
    <form
      className="mt-3 grid gap-3 sm:grid-cols-3"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        void db.quotations
          .revise(quoteId, {
            description: String(data.get("description") || defaults.description),
            totalKobo: nairaToKobo(Number(data.get("total") || defaults.totalKobo / 100)),
            depositKobo: nairaToKobo(Number(data.get("deposit") || defaults.depositKobo / 100)),
          })
          .then(() => {
            toast.success("Quote revised and re-sent.");
            onDone();
          })
          .catch((error) => toast.error(error instanceof Error ? error.message : "Could not revise."));
      }}
    >
      <Field label="Quote copy">
        <input name="description" defaultValue={defaults.description} className={inputClass} />
      </Field>
      <Field label="Total ₦">
        <input name="total" type="number" defaultValue={defaults.totalKobo / 100} className={inputClass} />
      </Field>
      <Field label="Deposit ₦">
        <input name="deposit" type="number" defaultValue={defaults.depositKobo / 100} className={inputClass} />
      </Field>
      <OsButton type="submit" variant="gold">
        Revise quote
      </OsButton>
    </form>
  );
}

export default function StudioCustom() {
  const { data: requests, reload } = useAsync(() => db.customDesigns.listAll(), []);
  const { data: quotes } = useAsync(() => db.quotations.listAll(), []);
  const [revising, setRevising] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader title="Custom requests" subtitle="Quote from the desk. The client accepts in their book." />
      {(requests ?? []).map((item) => {
        const quote = (quotes ?? []).find((entry) => entry.requestId === item.id);
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
                <StatusBadge label={statusLabel(quote.status)} tone={statusTone(quote.status)} />
                <div className="mt-2 flex flex-wrap gap-2">
                  <Link to="/studio/quotes" className="text-xs underline">
                    Open quotes file
                  </Link>
                  {quote.status === "sent" ? (
                    <button type="button" className="text-xs underline" onClick={() => setRevising(revising === quote.id ? null : quote.id)}>
                      {revising === quote.id ? "Close revise" : "Revise quote"}
                    </button>
                  ) : null}
                </div>
                {revising === quote.id && quote.status === "sent" ? (
                  <ReviseQuoteForm
                    quoteId={quote.id}
                    defaults={quote}
                    onDone={() => {
                      setRevising(null);
                      reload();
                    }}
                  />
                ) : null}
              </div>
            ) : null}
            {item.status === "new" ? (
              <form
                className="mt-4 grid gap-3 sm:grid-cols-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  const data = new FormData(event.currentTarget);
                  void db.quotations
                    .createFromRequest(item.id, {
                      description: String(data.get("description") || `${item.colour} ${item.outfitType}`),
                      totalKobo: nairaToKobo(Number(data.get("total") || 400000)),
                      depositKobo: nairaToKobo(Number(data.get("deposit") || 240000)),
                    })
                    .then((sent) => {
                      toast.success(`Sent ${sent.number}`);
                      reload();
                    });
                }}
              >
                <Field label="Quote copy">
                  <input name="description" defaultValue={`${item.colour} ${item.outfitType}`} className={inputClass} />
                </Field>
                <Field label="Total ₦">
                  <input name="total" type="number" defaultValue={400000} className={inputClass} />
                </Field>
                <Field label="Deposit ₦">
                  <input name="deposit" type="number" defaultValue={240000} className={inputClass} />
                </Field>
                <OsButton type="submit" variant="gold">
                  Send quote
                </OsButton>
              </form>
            ) : item.status === "quoted" && !quote ? (
              <p className="mt-3 text-sm text-muted">Quoted — see the quotes file.</p>
            ) : null}
          </SectionCard>
        );
      })}
    </div>
  );
}
