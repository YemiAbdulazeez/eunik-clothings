import { Link, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { RotateCcw } from "lucide-react";
import OrderStepper from "@/components/os/OrderStepper";
import { AsyncGuard } from "@/components/AsyncState";
import { EmptyState, OsButton, PageHeader, PageLoading, SectionCard, StatusBadge } from "@/components/os/ui";
import { db } from "@/db/database";
import { useAsync } from "@/hooks/useAsync";
import { formatNaira } from "@/lib/money";
import { statusLabel, statusTone } from "@/lib/format";
import { shopHref } from "@/lib/osNav";

export default function AccountOrders() {
  const location = useLocation();
  const { data: bundle, loading, error, reload } = useAsync(async () => {
    const rows = await db.orders.listMine();
    // Stage comes on the order DTO — do not call studio/production (clients are forbidden).
    return rows.map((order) => ({ order, stage: order.productionStage ?? null }));
  }, []);

  async function reorder(id: string) {
    try {
      const n = await db.orders.reorder(id);
      toast.success(`${n} look(s) returned to your bag.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not re-order.");
    }
  }

  if (loading && !bundle) return <PageLoading />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        subtitle="Track every step, re-order a finished look, or pre-order the next cloth."
        onRefresh={() => reload()}
        actions={
          <Link to={shopHref(location.pathname)} className="os-pill bg-ink text-white">
            Shop again
          </Link>
        }
      />
      <AsyncGuard
        loading={false}
        error={error}
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
                      {order.priceOnRequest ? (
                        <span className="mr-2 inline-block rounded-full bg-gold/40 px-2 py-0.5 text-[11px] uppercase tracking-wide text-ink">
                          Request for price
                        </span>
                      ) : null}
                      {statusLabel(order.kind)} · {statusLabel(order.fulfillment)}
                    </p>
                    <p className="text-ink">
                      {order.priceOnRequest && order.totalKobo <= 0
                        ? "Awaiting house price"
                        : order.paidKobo < order.totalKobo
                          ? `${formatNaira(order.paidKobo)} paid · balance ${formatNaira(order.totalKobo - order.paidKobo)} due before delivery`
                          : `${formatNaira(order.paidKobo)} paid in full`}
                    </p>
                    {order.priceOnRequest && order.quoteStatus === "sent" && order.paidKobo < order.totalKobo ? (
                      <p className="text-sm text-muted">
                        Price ready — pay from the email/WhatsApp link or{" "}
                        <Link to="/account/payments" className="underline">
                          Payments
                        </Link>
                        .
                      </p>
                    ) : null}
                    <OrderStepper status={order.status} stage={stage} kind={order.kind} compact createdAt={order.createdAt} />
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
