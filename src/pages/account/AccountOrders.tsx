import { Link, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { RotateCcw } from "lucide-react";
import OrderStepper from "@/components/os/OrderStepper";
import { AsyncGuard } from "@/components/AsyncState";
import { EmptyState, OsButton, PageHeader, SectionCard, StatusBadge } from "@/components/os/ui";
import { db } from "@/db/database";
import { useAsync } from "@/hooks/useAsync";
import { formatNaira } from "@/lib/money";
import { statusLabel, statusTone } from "@/lib/format";
import { shopHref } from "@/lib/osNav";

export default function AccountOrders() {
  const location = useLocation();
  const { data: bundle, loading, error } = useAsync(async () => {
    const rows = await db.orders.listMine();
    const stages = await Promise.all(rows.map((order) => db.production.getByOrder(order.id)));
    return rows.map((order, index) => ({ order, stage: stages[index]?.stage ?? null }));
  }, []);

  async function reorder(id: string) {
    try {
      const n = await db.orders.reorder(id);
      toast.success(`${n} look(s) returned to your bag.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not re-order.");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        subtitle="Track every step, re-order a finished look, or pre-order the next cloth."
        actions={
          <Link to={shopHref(location.pathname)} className="os-pill bg-ink text-white">
            Shop again
          </Link>
        }
      />
      <AsyncGuard
        loading={loading}
        error={error}
        skeleton={<p className="py-10 text-center text-sm text-muted">Opening your orders…</p>}
        empty={!bundle?.length ? <EmptyState title="No orders yet" text="Add something from the shop to place your first order." /> : undefined}
      >
        {bundle?.length ? (
        <div className="space-y-4">
          {(bundle ?? []).map(({ order, stage }) => {
            return (
              <SectionCard
                key={order.id}
                title={`#${order.number} ${order.name}`}
                action={<StatusBadge label={statusLabel(order.status)} tone={statusTone(order.status)} />}
              >
                <div className="grid gap-4 md:grid-cols-[120px_1fr]">
                  {order.image ? <img src={order.image} alt="" className="h-28 w-full rounded-xl object-cover" /> : <div />}
                  <div className="space-y-3">
                    <p className="text-sm capitalize">
                      {statusLabel(order.kind)} · {statusLabel(order.fulfillment)}
                    </p>
                    <p className="text-ink">
                      {formatNaira(order.paidKobo)} paid of {formatNaira(order.totalKobo)}
                    </p>
                    <OrderStepper status={order.status} stage={stage} kind={order.kind} />
                    <div className="flex flex-wrap gap-2">
                      {order.paidKobo < order.totalKobo ? (
                        <Link to="/account/payments" className="os-pill bg-gold text-ink">
                          Pay balance
                        </Link>
                      ) : null}
                      <OsButton variant="ghost" onClick={() => void reorder(order.id)}>
                        <RotateCcw className="h-4 w-4" /> Re-order
                      </OsButton>
                    </div>
                  </div>
                </div>
              </SectionCard>
            );
          })}
        </div>
        ) : null}
      </AsyncGuard>
    </div>
  );
}
