import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import OrderStepper from "@/components/os/OrderStepper";
import { OsButton, PageHeader, SectionCard, StatusBadge, StatCard } from "@/components/os/ui";
import { db } from "@/db/database";
import { useAsync } from "@/hooks/useAsync";
import { formatNaira } from "@/lib/money";
import { statusLabel, statusTone } from "@/lib/format";
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
  const { data: order } = useAsync(() => db.orders.get(id), [id]);
  const { data: prod } = useAsync(() => db.production.getByOrder(id), [id]);
  const { data: items } = useAsync(() => db.orders.items(id), [id]);

  if (!order) return <p>Loading order…</p>;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Order monitoring"
        title={`#${order.number} ${order.name}`}
        subtitle={`${order.customerName} · ${order.customerPhone} · ${order.customerEmail}`}
        actions={
          <Link to={`/studio/customers/${order.customerId}`} className="os-pill border border-line">
            Client file
          </Link>
        }
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total" value={formatNaira(order.totalKobo)} />
        <StatCard label="Paid" value={formatNaira(order.paidKobo)} />
        <StatCard label="Status" value={statusLabel(order.status)} />
      </div>
      <SectionCard title="Progress">
        <OrderStepper status={order.status} stage={prod?.stage} kind={order.kind} createdAt={order.createdAt} />
      </SectionCard>
      <SectionCard title="Update status">
        <div className="flex flex-wrap gap-2">
          {FLOW.map((status) => (
            <OsButton
              key={status}
              variant={status === order.status ? "gold" : "ghost"}
              onClick={() =>
                void db.orders.updateStatus(order.id, status).then(() => toast.success(`Moved to ${statusLabel(status)}.`))
              }
            >
              {statusLabel(status)}
            </OsButton>
          ))}
        </div>
      </SectionCard>
      <SectionCard title="Lines">
        <ul className="space-y-2 text-sm">
          {(items ?? []).map((item) => (
            <li key={item.id} className="flex justify-between border-b border-line py-2">
              <span>
                {item.qty} × {item.name}
              </span>
              <span>{formatNaira(item.unitKobo * item.qty)}</span>
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
