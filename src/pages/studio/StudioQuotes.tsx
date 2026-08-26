import { Link } from "react-router-dom";
import { Fragment, useState } from "react";
import { toast } from "sonner";
import { Field, OsButton, PageError, PageHeader, PageLoading, SectionCard, StatusBadge, StatCard, inputClass } from "@/components/os/ui";
import { db } from "@/db/database";
import { useAsync } from "@/hooks/useAsync";
import { formatNaira, nairaToKobo } from "@/lib/money";
import { statusLabel, statusTone } from "@/lib/format";

export default function StudioQuotes() {
  const { data: quotes, reload, loading, error } = useAsync(() => db.quotations.listAll(), []);
  const [revising, setRevising] = useState<string | null>(null);
  const [reviseBusy, setReviseBusy] = useState(false);
  const waiting = quotes?.filter((item) => item.status === "sent").length ?? 0;

  if (loading && !quotes) return <PageLoading />;
  if (error && !quotes) return <PageError message={error} onRetry={() => reload()} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quotes"
        subtitle="Sent quotes wait in the client book until accept or reject. Request-for-price catalogue orders sync here too."
        onRefresh={() => reload()}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="On file" value={String(quotes?.length ?? 0)} />
        <StatCard label="Waiting accept" value={String(waiting)} tone="gold" />
        <StatCard
          label="Pipeline ₦"
          value={formatNaira((quotes ?? []).filter((item) => item.status === "sent").reduce((sum, item) => sum + item.totalKobo, 0))}
        />
      </div>
      <SectionCard>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-muted">
                <th className="py-2">Number</th>
                <th>Description</th>
                <th>Status</th>
                <th>Total</th>
                <th>Deposit</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {(quotes ?? []).map((item) => (
                <Fragment key={item.id}>
                  <tr className="border-b border-line/60">
                    <td className="py-3 font-medium text-ink">
                      {item.number}
                      {item.orderId ? (
                        <Link to={`/studio/orders/${item.orderId}`} className="mt-1 block text-xs font-normal underline">
                          Linked order
                        </Link>
                      ) : null}
                    </td>
                    <td>
                      {item.orderId ? (
                        <span className="mr-2 rounded-full bg-gold/40 px-2 py-0.5 text-[10px] uppercase tracking-wide">
                          Request for price
                        </span>
                      ) : null}
                      {item.description}
                    </td>
                    <td>
                      <StatusBadge label={statusLabel(item.status)} tone={statusTone(item.status)} />
                    </td>
                    <td>{formatNaira(item.totalKobo)}</td>
                    <td>{formatNaira(item.depositKobo)}</td>
                    <td>
                      {item.status === "sent" ? (
                        <button
                          type="button"
                          className="text-xs underline"
                          onClick={() => setRevising(revising === item.id ? null : item.id)}
                        >
                          {revising === item.id ? "Close" : "Revise"}
                        </button>
                      ) : null}
                    </td>
                  </tr>
                  {revising === item.id && item.status === "sent" ? (
                    <tr className="border-b border-line/60 bg-paper/50">
                      <td colSpan={6} className="px-3 py-4">
                        <form
                          className="grid gap-3 sm:grid-cols-3"
                          onSubmit={(event) => {
                            event.preventDefault();
                            if (reviseBusy) return;
                            const data = new FormData(event.currentTarget);
                            setReviseBusy(true);
                            void db.quotations
                              .revise(item.id, {
                                description: String(data.get("description") || item.description),
                                totalKobo: nairaToKobo(Number(data.get("total") || item.totalKobo / 100)),
                                depositKobo: nairaToKobo(Number(data.get("deposit") || item.depositKobo / 100)),
                              })
                              .then(async () => {
                                toast.success(`${item.number} revised.`);
                                setRevising(null);
                                await reload();
                              })
                              .catch((err) => toast.error(err instanceof Error ? err.message : "Could not revise."))
                              .finally(() => setReviseBusy(false));
                          }}
                        >
                          <Field label="Quote copy">
                            <input name="description" defaultValue={item.description} className={inputClass} disabled={reviseBusy} />
                          </Field>
                          <Field label="Total ₦">
                            <input name="total" type="number" defaultValue={item.totalKobo / 100} className={inputClass} disabled={reviseBusy} />
                          </Field>
                          <Field label="Deposit ₦">
                            <input name="deposit" type="number" defaultValue={item.depositKobo / 100} className={inputClass} disabled={reviseBusy} />
                          </Field>
                          <OsButton type="submit" variant="gold" loading={reviseBusy} loadingText="Saving…">
                            Save revision
                          </OsButton>
                        </form>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
