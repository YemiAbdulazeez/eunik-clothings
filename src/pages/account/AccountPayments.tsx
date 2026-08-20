import { toast } from "sonner";
import PayMethods from "@/components/PayMethods";
import { PageHeader, SectionCard, StatCard, StatusBadge } from "@/components/os/ui";
import { db } from "@/db/database";
import { useAsync } from "@/hooks/useAsync";
import { formatNaira } from "@/lib/money";
import { formatWhen, statusLabel, statusTone } from "@/lib/format";

export default function AccountPayments() {
  const { data: orders, reload: refreshOrders } = useAsync(() => db.orders.listMine(), []);
  const { data: payments, reload: refreshPayments } = useAsync(() => db.payments.list(), []);
  const dues = (orders ?? []).filter((item) => item.paidKobo < item.totalKobo && item.status !== "cancelled");
  const settled = (payments ?? []).filter((item) => item.status === "successful").reduce((sum, item) => sum + item.amountKobo, 0);
  const openTotal = dues.reduce((sum, item) => sum + (item.totalKobo - item.paidKobo), 0);

  async function payDue(orderId: string, choice: Parameters<typeof db.orders.payBalance>[1]) {
    try {
      await db.orders.payBalance(orderId, choice);
      await refreshOrders();
      await refreshPayments();
      toast.success(choice.method === "paystack" ? "Demo Paystack recorded." : "Receipt submitted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Payment failed.");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Payments" subtitle="Paystack (demo) or bank transfer with a receipt. Naira only." />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Settled" value={formatNaira(settled)} />
        <StatCard label="Open balance" value={formatNaira(openTotal)} tone={openTotal ? "gold" : "plain"} />
        <StatCard label="Open orders" value={String(dues.length)} />
      </div>
      {dues.length ? (
        dues.map((due) => (
          <SectionCard key={due.id} title={`Pay #${due.number} · ${formatNaira(due.totalKobo - due.paidKobo)}`}>
            <p className="mb-4 text-sm">
              {due.name} · <StatusBadge label={statusLabel(due.status)} tone={statusTone(due.status)} />
            </p>
            <PayMethods
              amountKobo={due.totalKobo - due.paidKobo}
              busy={false}
              onPay={(choice) => payDue(due.id, choice)}
            />
          </SectionCard>
        ))
      ) : (
        <SectionCard title="Nothing due">Nothing left to pay.</SectionCard>
      )}
      <SectionCard title="Ledger">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-muted">
                <th className="py-2">When</th>
                <th>Method</th>
                <th>Ref</th>
                <th>Status</th>
                <th>₦</th>
              </tr>
            </thead>
            <tbody>
              {(payments ?? []).map((item) => (
                <tr key={item.id} className="border-b border-line/60">
                  <td className="py-3">{formatWhen(item.submittedAt)}</td>
                  <td className="capitalize">{item.method.replace("_", " ")}</td>
                  <td className="max-w-[180px] truncate">{item.paystackReference || item.transactionNumber || "—"}</td>
                  <td>
                    <StatusBadge label={statusLabel(item.status)} tone={statusTone(item.status)} />
                  </td>
                  <td className="text-ink">{formatNaira(item.amountKobo)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
