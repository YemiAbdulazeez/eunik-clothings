import { useState } from "react";
import { toast } from "sonner";
import { PageHeader, PageLoading, SectionCard, StatCard, StatusBadge, OsButton, NeedAttention } from "@/components/os/ui";
import { db } from "@/db/database";
import { useAsync } from "@/hooks/useAsync";
import { formatNaira } from "@/lib/money";
import { formatWhen, statusLabel, statusTone } from "@/lib/format";
import type { Payment } from "@/db/types";

function receiptSrc(payment: Payment) {
  return payment.receiptUrl || payment.receiptDataUrl || "";
}

export default function StudioPayments() {
  const { data: payments, loading, reload } = useAsync(() => db.payments.list(), []);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const waiting = (payments ?? []).filter((item) => item.status === "awaiting_verification");
  const ok = (payments ?? []).filter((item) => item.status === "successful").reduce((sum, item) => sum + item.amountKobo, 0);
  const selected =
    (selectedId ? (payments ?? []).find((item) => item.id === selectedId) : null) ??
    waiting[0] ??
    null;

  async function approve(item: Payment) {
    if (!confirm(`Approve bank transfer ${formatNaira(item.amountKobo)} for order ${item.orderNumber || item.orderId}?`)) {
      return;
    }
    await db.payments.reviewTransfer(item.id, "approve");
    toast.success("Transfer approved — client emailed.");
    setSelectedId(null);
    await reload();
  }

  async function reject(item: Payment) {
    const reason = rejectReason.trim();
    if (!reason) {
      toast.error("Enter a reason for the client.");
      return;
    }
    await db.payments.reviewTransfer(item.id, "reject", reason);
    toast.message("Transfer rejected — client emailed.");
    setRejectingId(null);
    setRejectReason("");
    setSelectedId(null);
    await reload();
  }

  if (loading && !payments) return <PageLoading />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        subtitle="Confirm bank transfers, and review cash / POS / offline bookings from keyed-in orders."
        onRefresh={() => reload()}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Collected" value={formatNaira(ok)} />
        <StatCard label="Awaiting review" value={String(waiting.length)} tone={waiting.length ? "alert" : "plain"} />
        <StatCard label="Rows" value={String(payments?.length ?? 0)} />
      </div>

      <NeedAttention
        items={waiting.map((item) => ({
          id: item.id,
          title: `${formatNaira(item.amountKobo)} bank transfer`,
          detail: `${item.orderNumber || "Order"} · ${item.customerName || "Client"} · ${item.transactionNumber || "No txn #"}`,
          actionLabel: "Review",
          onAction: () => {
            setSelectedId(item.id);
            setRejectingId(null);
          },
        }))}
      />

      {selected && selected.status === "awaiting_verification" ? (
        <SectionCard title="Transfer under review">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-3 text-sm">
              <p>
                <span className="os-label">Order</span>
                <br />
                <span className="font-medium text-ink">{selected.orderNumber || selected.orderId}</span>
              </p>
              <p>
                <span className="os-label">Client</span>
                <br />
                <span className="text-ink">{selected.customerName || "—"}</span>
                {selected.customerEmail ? <span className="block text-muted">{selected.customerEmail}</span> : null}
              </p>
              <p>
                <span className="os-label">Amount claimed</span>
                <br />
                <span className="font-alt text-2xl text-ink">{formatNaira(selected.amountKobo)}</span>
                <span className="ml-2 capitalize text-muted">{selected.type}</span>
              </p>
              {selected.orderTotalKobo != null ? (
                <p>
                  <span className="os-label">Order total / paid</span>
                  <br />
                  {formatNaira(selected.orderTotalKobo)} · paid {formatNaira(selected.orderPaidKobo ?? 0)}
                  {selected.orderStatus ? (
                    <span className="ml-2">
                      <StatusBadge label={statusLabel(selected.orderStatus)} tone={statusTone(selected.orderStatus)} />
                    </span>
                  ) : null}
                </p>
              ) : null}
              <p>
                <span className="os-label">Transaction number</span>
                <br />
                <span className="font-mono text-base text-ink">{selected.transactionNumber || "—"}</span>
              </p>
              <p>
                <span className="os-label">Submitted</span>
                <br />
                {formatWhen(selected.submittedAt)}
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                <OsButton variant="gold" loadingText="Approving…" onClick={() => approve(selected)}>
                  Confirm payment
                </OsButton>
                <OsButton
                  variant="ghost"
                  onClick={() => {
                    setRejectingId(selected.id);
                    setRejectReason("");
                  }}
                >
                  Reject
                </OsButton>
              </div>
              {rejectingId === selected.id ? (
                <div className="space-y-2 rounded-xl border border-line bg-paper p-3">
                  <label className="block text-sm">
                    <span className="os-label">Reason for client</span>
                    <textarea
                      value={rejectReason}
                      onChange={(event) => setRejectReason(event.target.value)}
                      rows={3}
                      className="mt-1 w-full border border-line px-3 py-2 text-ink"
                      placeholder="e.g. Amount does not match / unclear receipt / wrong narration"
                    />
                  </label>
                  <OsButton variant="ghost" loadingText="Rejecting…" onClick={() => reject(selected)}>
                    Send rejection
                  </OsButton>
                </div>
              ) : null}
            </div>
            <div>
              <p className="os-label mb-2">Payment receipt</p>
              {receiptSrc(selected) ? (
                <a href={receiptSrc(selected)} target="_blank" rel="noreferrer" className="block">
                  <img
                    src={receiptSrc(selected)}
                    alt="Bank transfer receipt"
                    className="max-h-[28rem] w-full rounded-xl border border-line object-contain bg-paper"
                  />
                </a>
              ) : (
                <p className="rounded-xl border border-dashed border-line px-4 py-12 text-center text-sm text-muted">
                  No receipt attached.
                </p>
              )}
            </div>
          </div>
        </SectionCard>
      ) : null}

      <SectionCard title="Ledger">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-muted">
                <th className="py-2">When</th>
                <th>Order</th>
                <th>Client</th>
                <th>Method</th>
                <th>Txn / ref</th>
                <th>Status</th>
                <th>₦</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(payments ?? []).map((item) => (
                <tr key={item.id} className="border-b border-line/60">
                  <td className="py-3">{formatWhen(item.submittedAt)}</td>
                  <td className="font-medium text-ink">{item.orderNumber || item.orderId.slice(0, 8)}</td>
                  <td>{item.customerName || "—"}</td>
                  <td className="capitalize">{item.method.replace("_", " ")}</td>
                  <td className="font-mono text-xs">{item.paystackReference || item.transactionNumber || "—"}</td>
                  <td>
                    <StatusBadge label={statusLabel(item.status)} tone={statusTone(item.status)} />
                  </td>
                  <td className="text-ink">{formatNaira(item.amountKobo)}</td>
                  <td>
                    {item.status === "awaiting_verification" ? (
                      <OsButton
                        variant="ghost"
                        onClick={() => {
                          setSelectedId(item.id);
                          setRejectingId(null);
                        }}
                      >
                        Open
                      </OsButton>
                    ) : receiptSrc(item) ? (
                      <a href={receiptSrc(item)} target="_blank" rel="noreferrer" className="underline">
                        Receipt
                      </a>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
