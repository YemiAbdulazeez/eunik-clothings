import { Link } from "react-router-dom";
import { PageHeader, PageLoading, SectionCard, StatusBadge, StatCard, OsButton } from "@/components/os/ui";
import StudioManualOrderForm from "@/components/studio/StudioManualOrderForm";
import { db } from "@/db/database";
import { useAsync } from "@/hooks/useAsync";
import { formatNaira } from "@/lib/money";
import {
  statusLabel,
  statusTone,
  orderSourceLabel,
  isKeyedInOrder,
  ORDER_SOURCE_FILTERS,
} from "@/lib/format";
import { useMemo, useState } from "react";
import type { Order } from "@/db/types";
import { useSession } from "@/context/SessionProvider";

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

const STATUS_KIND_FILTERS = ["all", "production", "awaiting_transfer", "ready", "bespoke", "made_to_measure"] as const;

export default function StudioOrders() {
  const { user } = useSession();
  const { data: orders, loading, reload } = useAsync(() => db.orders.listAll(), []);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [manualOpen, setManualOpen] = useState(false);

  const rows = useMemo(() => {
    return (orders ?? []).filter((item) => {
      const statusOk =
        statusFilter === "all" || item.status === statusFilter || item.kind === statusFilter;
      const source = item.source || "online";
      const sourceOk =
        sourceFilter === "all" ||
        source === sourceFilter ||
        (sourceFilter === "offline" && (source === "offline" || source === "manual"));
      return statusOk && sourceOk;
    });
  }, [orders, statusFilter, sourceFilter]);

  const canKeyIn =
    user?.role === "super_admin" || user?.role === "manager" || user?.role === "desk";

  if (loading && !orders) return <PageLoading />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        subtitle="Ready to wear, made to measure, and custom orders — including offline key-ins."
        onRefresh={() => reload()}
        actions={
          canKeyIn ? (
            <OsButton onClick={() => setManualOpen((v) => !v)}>
              {manualOpen ? "Hide form" : "Key in offline order"}
            </OsButton>
          ) : null
        }
      />
      {manualOpen ? (
        <StudioManualOrderForm
          open={manualOpen}
          onClose={() => setManualOpen(false)}
          onCreated={() => void reload()}
        />
      ) : null}
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

      <div className="space-y-2">
        <p className="os-label px-1">Status / kind</p>
        <div className="flex flex-wrap gap-2 rounded-full border border-line bg-white p-1">
          {STATUS_KIND_FILTERS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setStatusFilter(key)}
              className={`rounded-full px-4 py-1.5 text-sm capitalize ${statusFilter === key ? "bg-ink text-white" : "text-ink"}`}
            >
              {key === "all" ? "All" : statusLabel(key)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="os-label px-1">Source</p>
        <div className="flex flex-wrap gap-2 rounded-full border border-line bg-white p-1">
          <button
            type="button"
            onClick={() => setSourceFilter("all")}
            className={`rounded-full px-4 py-1.5 text-sm ${sourceFilter === "all" ? "bg-ink text-white" : "text-ink"}`}
          >
            All sources
          </button>
          {ORDER_SOURCE_FILTERS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setSourceFilter(key)}
              className={`rounded-full px-4 py-1.5 text-sm ${sourceFilter === key ? "bg-ink text-white" : "text-ink"}`}
            >
              {label}
            </button>
          ))}
        </div>
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
                <th>Source</th>
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
                    <StatusBadge
                      label={orderSourceLabel(order.source)}
                      tone={isKeyedInOrder(order.source) ? "gold" : "muted"}
                    />
                  </td>
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
