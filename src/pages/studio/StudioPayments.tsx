import { toast } from "sonner";
import { PageHeader, PageLoading, SectionCard, StatCard, StatusBadge, OsButton, NeedAttention } from "@/components/os/ui";
import { db } from "@/db/database";
import { useAsync } from "@/hooks/useAsync";
import { formatNaira } from "@/lib/money";
import { formatWhen, statusLabel, statusTone } from "@/lib/format";

export default function StudioPayments() {
  const { data: payments, loading } = useAsync(() => db.payments.list(), []);
  const waiting = (payments ?? []).filter((item) => item.status === "awaiting_verification");
  const ok = (payments ?? []).filter((item) => item.status === "successful").reduce((sum, item) => sum + item.amountKobo, 0);

  if (loading && !payments) return <PageLoading />;

  return (
    <div className="space-y-6">
      <PageHeader title="Payments" subtitle="Approve bank receipts. Demo Paystack is already marked successful — no card is charged." />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Collected" value={formatNaira(ok)} />
        <StatCard label="Awaiting review" value={String(waiting.length)} tone={waiting.length ? "alert" : "plain"} />
        <StatCard label="Rows" value={String(payments?.length ?? 0)} />
      </div>
      <NeedAttention
        items={waiting.map((item) => ({
          id: item.id,
          title: `${formatNaira(item.amountKobo)} transfer to review`,
          detail: `${item.transactionNumber} · ${item.orderId.replace("order_", "#")}`,
          actionLabel: "Approve",
          onAction: () => db.payments.reviewTransfer(item.id, "approve").then(() => toast.success("Receipt approved.")),
        }))}
      />
      <SectionCard title="Ledger">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-muted">
                <th className="py-2">When</th>
                <th>Method</th>
                <th>Ref</th>
                <th>Status</th>
                <th>₦</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(payments ?? []).map((item) => (
                <tr key={item.id} className="border-b border-line/60">
                  <td className="py-3">{formatWhen(item.submittedAt)}</td>
                  <td className="capitalize">{item.method.replace("_", " ")}</td>
                  <td>{item.paystackReference || item.transactionNumber}</td>
                  <td>
                    <StatusBadge label={statusLabel(item.status)} tone={statusTone(item.status)} />
                  </td>
                  <td className="text-ink">{formatNaira(item.amountKobo)}</td>
                  <td>
                    {item.status === "awaiting_verification" ? (
                      <div className="flex gap-2">
                        <OsButton variant="gold" onClick={() => db.payments.reviewTransfer(item.id, "approve").then(() => toast.success("Approved."))}>
                          Approve
                        </OsButton>
                        <OsButton
                          variant="ghost"
                          onClick={() =>
                            db.payments.reviewTransfer(item.id, "reject", "Narration mismatch").then(() => toast.message("Rejected."))
                          }
                        >
                          Reject
                        </OsButton>
                      </div>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {waiting[0]?.receiptDataUrl ? (
          <div className="mt-4">
            <p className="os-label mb-2">Latest receipt</p>
            <img src={waiting[0].receiptDataUrl} alt="Receipt" className="max-h-48 rounded-xl border border-line object-contain" />
          </div>
        ) : null}
      </SectionCard>
    </div>
  );
}
