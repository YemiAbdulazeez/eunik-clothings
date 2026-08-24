import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import OrderStepper from "@/components/os/OrderStepper";
import { OsButton, PageHeader, PageLoading, SectionCard, StatusBadge, StatCard } from "@/components/os/ui";
import { db } from "@/db/database";
import { useAsync } from "@/hooks/useAsync";
import { formatNaira } from "@/lib/money";
import { statusLabel, statusTone, stageLabel } from "@/lib/format";
import type { OrderStatus } from "@/db/types";

const FLOW: OrderStatus[] = [
  "pending_payment",
  "awaiting_transfer",
  "confirmed",
  "processing",
  "production",
  "ready",
  "dispatched",
  "delivered",
];

export default function StudioOrderDetail() {
  const { id = "" } = useParams();
  const { data: order, reload: reloadOrder, loading } = useAsync(() => db.orders.get(id), [id]);
  const { data: prod, reload: reloadProd } = useAsync(() => db.production.getByOrder(id), [id]);
  const { data: items, reload: reloadItems } = useAsync(() => db.orders.items(id), [id]);

  async function setStatus(status: OrderStatus) {
    if (!order) return;
    try {
      await db.orders.updateStatus(order.id, status);
      await Promise.all([reloadOrder(), reloadProd(), reloadItems()]);
      toast.success(
        status === "production" || status === "processing"
          ? `Moved to ${statusLabel(status)} — on the production board. Client emailed.`
          : `Moved to ${statusLabel(status)}. Client emailed.`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update status.");
    }
  }

  if (loading && !order) return <PageLoading />;
  if (!order) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted">Order not found.</p>
        <Link to="/studio/orders" className="os-pill border border-line">
          Back to orders
        </Link>
      </div>
    );
  }

  const lineItems = items?.length ? items : order.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Order monitoring"
        title={`#${order.number} ${order.name}`}
        subtitle={`${order.customerName} · ${order.customerPhone} · ${order.customerEmail}`}
        onRefresh={() => Promise.all([reloadOrder(), reloadProd(), reloadItems()])}
        actions={
          <div className="flex flex-wrap gap-2">
            {(order.status === "production" || order.status === "processing" || prod) && (
              <Link to="/studio/production" className="os-pill bg-gold text-ink">
                Open production
              </Link>
            )}
            <Link to={`/studio/customers/${order.customerId}`} className="os-pill border border-line">
              Client file
            </Link>
          </div>
        }
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total" value={formatNaira(order.totalKobo)} />
        <StatCard label="Paid" value={formatNaira(order.paidKobo)} />
        <StatCard label="Status" value={statusLabel(order.status)} />
      </div>
      <SectionCard title="Progress">
        <OrderStepper status={order.status} stage={prod?.stage} kind={order.kind} createdAt={order.createdAt} />
        {prod ? (
          <p className="mt-3 text-sm text-muted">
            Floor ticket · {stageLabel(prod.stage)} · due {prod.dueDate ?? "—"}
          </p>
        ) : (
          <p className="mt-3 text-sm text-muted">
            No floor ticket yet. Move status to <span className="text-ink">In the atelier</span> to open one on
            Production.
          </p>
        )}
      </SectionCard>
      <SectionCard title="Update status">
        <p className="mb-3 text-sm text-muted">Each change emails the client and keeps Production in sync.</p>
        <div className="flex flex-wrap gap-2">
          {FLOW.map((status) => (
            <OsButton
              key={status}
              variant={status === order.status ? "gold" : "ghost"}
              onClick={() => setStatus(status)}
            >
              {statusLabel(status)}
            </OsButton>
          ))}
          <OsButton
            variant={order.status === "cancelled" ? "danger" : "ghost"}
            onClick={() => setStatus("cancelled")}
          >
            {statusLabel("cancelled")}
          </OsButton>
        </div>
      </SectionCard>
      <SectionCard title="Lines">
        <ul className="space-y-2 text-sm">
          {lineItems.map((item) => (
            <li key={item.id ?? `${item.name}-${item.sku}`} className="flex justify-between border-b border-line py-2">
              <span>
                {item.qty} × {item.name}
              </span>
              <span>{formatNaira((item.unitKobo ?? 0) * (item.qty ?? 1))}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3">
          <StatusBadge label={statusLabel(order.kind)} tone={statusTone(order.status)} />
        </p>
      </SectionCard>
    </div>
  );
}
