import { Link } from "react-router-dom";
import { PageHeader, PageLoading, SectionCard, StatusBadge, StatCard } from "@/components/os/ui";
import { db } from "@/db/database";
import { useAsync } from "@/hooks/useAsync";
import { formatNaira } from "@/lib/money";
import { statusLabel, statusTone } from "@/lib/format";
import { useMemo, useState } from "react";

export default function StudioOrders() {
  const { data: orders, loading } = useAsync(() => db.orders.listAll(), []);
  const [filter, setFilter] = useState("all");
  const rows = useMemo(
    () => (orders ?? []).filter((item) => (filter === "all" ? true : item.status === filter || item.kind === filter)),
    [orders, filter],
  );

  if (loading && !orders) return <PageLoading />;

  return (
    <div className="space-y-6">
      <PageHeader title="Orders" subtitle="Ready to wear, made to measure, and custom orders." />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="All" value={String(orders?.length ?? 0)} />
        <StatCard label="In production" value={String(orders?.filter((item) => item.status === "production").length ?? 0)} />
        <StatCard label="Waiting for bank check" value={String(orders?.filter((item) => item.status === "awaiting_transfer").length ?? 0)} tone="gold" />
      </div>
      <div className="flex flex-wrap gap-2 rounded-full border border-line bg-white p-1">
        {["all", "production", "awaiting_transfer", "ready", "bespoke", "made_to_measure"].map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`rounded-full px-4 py-1.5 text-sm capitalize ${filter === key ? "bg-ink text-white" : "text-ink"}`}
          >
            {key === "all" ? "All" : statusLabel(key)}
          </button>
        ))}
      </div>
      <SectionCard>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-muted">
                <th className="py-3">#</th>
                <th>Client</th>
                <th>Look</th>
                <th>Kind</th>
                <th>Status</th>
                <th>Paid</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((order) => (
                <tr key={order.id} className="border-b border-line/60">
                  <td className="py-3 font-medium text-ink">
                    <Link to={`/studio/orders/${order.id}`} className="underline">
                      {order.number}
                    </Link>
                  </td>
                  <td>
                    <Link to={`/studio/customers/${order.customerId}`} className="underline">
                      {order.customerName}
                    </Link>
                  </td>
                  <td>{order.name}</td>
                  <td className="capitalize">{statusLabel(order.kind)}</td>
                  <td>
                    <StatusBadge label={statusLabel(order.status)} tone={statusTone(order.status)} />
                  </td>
                  <td>{formatNaira(order.paidKobo)}</td>
                  <td className="text-ink">{formatNaira(order.totalKobo)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
