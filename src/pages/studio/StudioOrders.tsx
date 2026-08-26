import { Link } from "react-router-dom";
import { PageHeader, PageLoading, SectionCard, StatusBadge, StatCard } from "@/components/os/ui";
import { db } from "@/db/database";
import { useAsync } from "@/hooks/useAsync";
import { formatNaira } from "@/lib/money";
import { statusLabel, statusTone } from "@/lib/format";
import { useMemo, useState } from "react";
import type { Order } from "@/db/types";

/** Prefer floor stage so /studio/orders matches the production board. */
function displayStatus(order: Order): string {
  if (order.productionStage && ["production", "processing", "confirmed", "ready", "delivered", "dispatched"].includes(order.status)) {
    return order.productionStage === "completed" && order.status === "delivered"
      ? "delivered"
      : order.productionStage === "ready"
        ? "ready"
        : order.productionStage;
  }
  return order.status;
}

export default function StudioOrders() {
  const { data: orders, loading, reload } = useAsync(() => db.orders.listAll(), []);
  const [filter, setFilter] = useState("all");
  const rows = useMemo(
    () => (orders ?? []).filter((item) => (filter === "all" ? true : item.status === filter || item.kind === filter)),
    [orders, filter],
  );

  if (loading && !orders) return <PageLoading />;

  return (
    <div className="space-y-6">
      <PageHeader title="Orders" subtitle="Ready to wear, made to measure, and custom orders." onRefresh={() => reload()} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="All" value={String(orders?.length ?? 0)} />
        <StatCard label="In production" value={String(orders?.filter((item) => item.status === "production").length ?? 0)} />
        <StatCard label="Waiting for bank check" value={String(orders?.filter((item) => item.status === "awaiting_transfer").length ?? 0)} tone="gold" />
        <StatCard
          label="Balance due"
          value={String(orders?.filter((item) => item.totalKobo > 0 && item.paidKobo < item.totalKobo && item.status !== "cancelled").length ?? 0)}
          tone="alert"
        />
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
                <th>Balance</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((order) => {
                const shown = displayStatus(order);
                const balance = Math.max(0, order.totalKobo - order.paidKobo);
                return (
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
                    <div className="flex flex-wrap items-center gap-2">
                      {order.priceOnRequest ? (
                        <StatusBadge label="Request for price" tone="warn" />
                      ) : null}
                      {balance > 0 && order.totalKobo > 0 ? (
                        <StatusBadge label="Balance due" tone="warn" />
                      ) : null}
                      <StatusBadge label={statusLabel(shown)} tone={statusTone(shown)} />
                    </div>
                  </td>
                  <td>{formatNaira(order.paidKobo)}</td>
                  <td className={balance > 0 ? "font-medium text-ink" : "text-muted"}>{formatNaira(balance)}</td>
                  <td className="text-ink">{formatNaira(order.totalKobo)}</td>
                </tr>
              );
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
