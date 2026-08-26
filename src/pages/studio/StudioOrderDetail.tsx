import { type FormEvent, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import OrderStepper from "@/components/os/OrderStepper";
import { Field, OsButton, PageHeader, PageLoading, SectionCard, StatusBadge, StatCard, inputClass } from "@/components/os/ui";
import { db } from "@/db/database";
import { useAsync } from "@/hooks/useAsync";
import { formatNaira, nairaToKobo } from "@/lib/money";
import { formatWhen, statusLabel, statusTone, stageLabel, orderSourceLabel, isKeyedInOrder } from "@/lib/format";
import type { OrderStatus, Payment } from "@/db/types";

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

function receiptSrc(payment: Payment) {
  return payment.receiptUrl || payment.receiptDataUrl || "";
}

export default function StudioOrderDetail() {
  const { id = "" } = useParams();
  const { data: order, reload: reloadOrder, loading } = useAsync(() => db.orders.get(id), [id]);
  const { data: prod, reload: reloadProd } = useAsync(() => db.production.getByOrder(id), [id]);
  const { data: items, reload: reloadItems } = useAsync(() => db.orders.items(id), [id]);
  const { data: payments, reload: reloadPayments } = useAsync(() => db.payments.getByOrder(id), [id]);
  const [priceBusy, setPriceBusy] = useState(false);
  const [payBusy, setPayBusy] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [lastLinks, setLastLinks] = useState<{ payUrl: string; cancelUrl: string; whatsappUrl: string } | null>(null);
  const [balanceBusy, setBalanceBusy] = useState(false);
  const [recordBusy, setRecordBusy] = useState(false);
  const [balanceLinks, setBalanceLinks] = useState<{ payUrl: string; whatsappUrl: string } | null>(null);

  const awaitingBank = (payments ?? []).filter(
    (item) => item.method === "bank_transfer" && item.status === "awaiting_verification",
  );

  async function setStatus(status: OrderStatus) {
    if (!order) return;
    try {
      await db.orders.updateStatus(order.id, status);
      await reloadOrder();
      await reloadProd();
      await reloadItems();
      toast.success(
        status === "production" || status === "processing"
          ? `Moved to ${statusLabel(status)} — on the production board. Client emailed.`
          : `Moved to ${statusLabel(status)}. Client emailed.`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update status.");
    }
  }

  async function approveTransfer(payment: Payment) {
    if (!confirm(`Confirm bank transfer ${formatNaira(payment.amountKobo)}? Order will move forward.`)) return;
    setPayBusy(payment.id);
    try {
      await db.payments.reviewTransfer(payment.id, "approve");
      toast.success("Payment confirmed — order status and progress updated. Client emailed.");
      await Promise.all([reloadOrder(), reloadProd(), reloadItems(), reloadPayments()]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not confirm payment.");
    } finally {
      setPayBusy(null);
    }
  }

  async function rejectTransfer(payment: Payment) {
    const reason = rejectReason.trim();
    if (!reason) {
      toast.error("Enter a reason for the client.");
      return;
    }
    setPayBusy(payment.id);
    try {
      await db.payments.reviewTransfer(payment.id, "reject", reason);
      toast.message("Transfer rejected — client emailed. Order reopened for payment.");
      setRejectingId(null);
      setRejectReason("");
      await Promise.all([reloadOrder(), reloadProd(), reloadItems(), reloadPayments()]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not reject payment.");
    } finally {
      setPayBusy(null);
    }
  }

  async function sendPrice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!order || priceBusy) return;
    const data = new FormData(event.currentTarget);
    const totalKobo = nairaToKobo(Number(data.get("total") || 0));
    const channel = String(data.get("channel") || "both") as "email" | "whatsapp" | "both";
    setPriceBusy(true);
    try {
      const result = await db.orders.sendPrice(order.id, {
        totalKobo,
        depositKobo: totalKobo,
        description: String(data.get("description") || "").trim() || undefined,
        channel,
      });
      setLastLinks({
        payUrl: result.payUrl,
        cancelUrl: result.cancelUrl,
        whatsappUrl: result.whatsappUrl,
      });
      if (channel === "whatsapp" || channel === "both") {
        window.open(result.whatsappUrl, "_blank", "noopener,noreferrer");
      }
      toast.success(
        result.emailed
          ? `${result.quotation.number} sent — client emailed with pay & cancel links.`
          : `${result.quotation.number} ready — WhatsApp opened with pay & cancel links.`,
      );
      await reloadOrder();
      await reloadItems();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send price.");
    } finally {
      setPriceBusy(false);
    }
  }

  async function requestBalance(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!order || balanceBusy) return;
    const data = new FormData(event.currentTarget);
    const channel = String(data.get("channel") || "both") as "email" | "whatsapp" | "both";
    setBalanceBusy(true);
    try {
      const result = await db.orders.requestBalance(order.id, {
        channel,
        message: String(data.get("message") || "").trim() || undefined,
      });
      setBalanceLinks({ payUrl: result.payUrl, whatsappUrl: result.whatsappUrl });
      if (channel === "whatsapp" || channel === "both") {
        window.open(result.whatsappUrl, "_blank", "noopener,noreferrer");
      }
      toast.success(
        result.emailed
          ? `Balance request sent — client emailed (${formatNaira(result.balanceKobo)}).`
          : `WhatsApp opened with balance pay link (${formatNaira(result.balanceKobo)}).`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not request balance.");
    } finally {
      setBalanceBusy(false);
    }
  }

  async function recordOfflinePayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!order || recordBusy) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const payInFull = data.get("payInFull") === "on";
    const amountNaira = Number(data.get("amount") || 0);
    const method = String(data.get("method") || "cash") as "cash" | "pos" | "offline" | "bank_transfer";
    setRecordBusy(true);
    try {
      await db.orders.recordPayment(order.id, {
        payInFull,
        amountKobo: payInFull ? undefined : nairaToKobo(amountNaira),
        method,
        transactionNumber: String(data.get("ref") || "").trim() || undefined,
        notifyClient: data.get("notify") === "on",
      });
      toast.success(payInFull ? "Marked paid in full — payments & analytics updated." : "Payment recorded.");
      form.reset();
      await Promise.all([reloadOrder(), reloadPayments(), reloadProd(), reloadItems()]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not record payment.");
    } finally {
      setRecordBusy(false);
    }
  }

  if (loading && !order) return <PageLoading />;
  if (!order) return <p className="p-8">Order not found.</p>;

  const lineItems = items?.length ? items : order.items ?? [];
  const awaitingPrice = Boolean(order.priceOnRequest) && (order.totalKobo <= 0 || order.quoteStatus !== "accepted");
  const balanceKobo = Math.max(0, order.totalKobo - order.paidKobo);
  const fullyPaid = order.totalKobo > 0 && balanceKobo <= 0;
  const statusShown =
    order.productionStage && ["production", "processing", "confirmed"].includes(order.status)
      ? order.productionStage
      : order.status;

  return (
    <div className="space-y-6">
      <PageHeader
        title={order.number}
        subtitle={order.name}
        onRefresh={() => Promise.all([reloadOrder(), reloadProd(), reloadItems(), reloadPayments()])}
        actions={
          <div className="flex flex-wrap gap-2">
            <StatusBadge
              label={orderSourceLabel(order.source)}
              tone={isKeyedInOrder(order.source) ? "gold" : "muted"}
            />
            {order.priceOnRequest ? (
              <StatusBadge label="Request for price" tone="warn" />
            ) : null}
            {order.status === "awaiting_transfer" ? (
              <StatusBadge label="Bank transfer to confirm" tone="warn" />
            ) : null}
            {prod && (
              <Link to="/studio/production" className="os-pill bg-gold text-ink">
                Open production
              </Link>
            )}
            <Link to={`/studio/customers/${order.customerId}`} className="os-pill border border-line">
              Client file
            </Link>
            <Link to="/studio/custom" className="os-pill border border-line">
              Custom requests
            </Link>
            <Link to="/studio/quotes" className="os-pill border border-line">
              Quotes
            </Link>
            <Link to="/studio/orders" className="os-pill border border-line">
              All orders
            </Link>
          </div>
        }
      />
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard
          label="Total"
          value={order.priceOnRequest && order.totalKobo <= 0 ? "Request for price" : formatNaira(order.totalKobo)}
        />
        <StatCard label="Paid" value={formatNaira(order.paidKobo)} />
        <StatCard
          label="Balance"
          value={order.totalKobo <= 0 ? "—" : formatNaira(balanceKobo)}
          tone={balanceKobo > 0 ? "alert" : "plain"}
        />
        <StatCard label="Status" value={statusLabel(statusShown)} />
      </div>
      {balanceKobo > 0 && order.totalKobo > 0 ? (
        <p className="rounded-xl border border-gold/40 bg-gold/20 px-4 py-3 text-sm text-ink">
          Balance {formatNaira(balanceKobo)} still due — collect before marking ready, dispatched, or delivered.
          Minimum booked so far should be at least {formatNaira(order.depositKobo || 0)} (70%+).
        </p>
      ) : null}

      {balanceKobo > 0 && order.totalKobo > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <SectionCard title="Request balance from client">
            <p className="mb-3 text-sm text-muted">
              Email and/or WhatsApp a pay link for {formatNaira(balanceKobo)}. Client can pay by Paystack or
              transfer; finance still confirms transfers.
            </p>
            <form className="grid gap-3" onSubmit={(event) => void requestBalance(event)}>
              <Field label="Channel">
                <select name="channel" defaultValue="both" className={inputClass} disabled={balanceBusy}>
                  <option value="both">Email + WhatsApp</option>
                  <option value="email">Email only</option>
                  <option value="whatsapp">WhatsApp only</option>
                </select>
              </Field>
              <Field label="Note (optional)">
                <input
                  name="message"
                  className={inputClass}
                  placeholder="e.g. Garment is almost ready — please settle the balance"
                  disabled={balanceBusy}
                />
              </Field>
              <OsButton type="submit" variant="gold" loading={balanceBusy} loadingText="Sending…">
                Send balance request
              </OsButton>
            </form>
            {balanceLinks ? (
              <div className="mt-4 space-y-1 break-all rounded-xl border border-line bg-paper/50 p-3 text-xs">
                <p>
                  Pay:{" "}
                  <a href={balanceLinks.payUrl} className="underline" target="_blank" rel="noreferrer">
                    {balanceLinks.payUrl}
                  </a>
                </p>
                <a href={balanceLinks.whatsappUrl} className="inline-block underline" target="_blank" rel="noreferrer">
                  Open WhatsApp again
                </a>
              </div>
            ) : null}
          </SectionCard>

          <SectionCard title="Record offline payment">
            <p className="mb-3 text-sm text-muted">
              Client paid cash, POS, or transfer outside the site — book it here so Payments, Analytics, Orders,
              and the client ledger stay in sync.
            </p>
            <form className="grid gap-3" onSubmit={(event) => void recordOfflinePayment(event)}>
              <label className="flex items-center gap-2 text-sm">
                <input name="payInFull" type="checkbox" defaultChecked />
                Mark paid in full ({formatNaira(balanceKobo)})
              </label>
              <Field label="Or partial amount (₦)">
                <input
                  name="amount"
                  type="number"
                  min={1}
                  step={1}
                  className={inputClass}
                  placeholder={String(Math.round(balanceKobo / 100))}
                  disabled={recordBusy}
                />
              </Field>
              <Field label="Method">
                <select name="method" defaultValue="cash" className={inputClass} disabled={recordBusy}>
                  <option value="cash">Cash</option>
                  <option value="pos">POS</option>
                  <option value="bank_transfer">Bank transfer (already received)</option>
                  <option value="offline">Offline / other</option>
                </select>
              </Field>
              <Field label="Reference (optional)">
                <input name="ref" className={inputClass} placeholder="Slip / txn ref" disabled={recordBusy} />
              </Field>
              <label className="flex items-center gap-2 text-sm">
                <input name="notify" type="checkbox" defaultChecked />
                Email client a payment receipt
              </label>
              <OsButton type="submit" loading={recordBusy} loadingText="Booking…">
                Book payment
              </OsButton>
            </form>
          </SectionCard>
        </div>
      ) : null}

      {(payments ?? []).length ? (
        <SectionCard title="Payment history">
          <ul className="divide-y divide-line text-sm">
            {(payments ?? []).map((payment) => (
              <li key={payment.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <p className="font-medium text-ink">
                    {formatNaira(payment.amountKobo)} · {payment.method.replaceAll("_", " ")} · {payment.type}
                  </p>
                  <p className="text-xs text-muted">
                    {formatWhen(payment.submittedAt)}
                    {payment.transactionNumber ? ` · ${payment.transactionNumber}` : ""}
                  </p>
                </div>
                <StatusBadge label={statusLabel(payment.status)} tone={statusTone(payment.status)} />
              </li>
            ))}
          </ul>
        </SectionCard>
      ) : null}

      {awaitingBank.length ? (
        <SectionCard title="Bank transfer — confirm payment">
          <p className="mb-4 text-sm text-muted">
            Confirm or reject here. Confirming credits the payment, confirms the order once the minimum (70%+) is met,
            opens the floor for made-to-measure / bespoke, and emails both parties. Balance can remain until delivery.
          </p>
          <div className="space-y-6">
            {awaitingBank.map((payment) => (
              <div key={payment.id} className="grid gap-4 rounded-xl border border-line p-4 lg:grid-cols-2">
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="os-label">Amount</span>
                    <br />
                    <span className="font-alt text-2xl text-ink">{formatNaira(payment.amountKobo)}</span>
                  </p>
                  <p>
                    <span className="os-label">Transaction number</span>
                    <br />
                    <span className="font-mono text-ink">{payment.transactionNumber || "—"}</span>
                  </p>
                  <p>
                    <span className="os-label">Submitted</span>
                    <br />
                    {formatWhen(payment.submittedAt)}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <OsButton
                      variant="gold"
                      loading={payBusy === payment.id}
                      loadingText="Confirming…"
                      onClick={() => void approveTransfer(payment)}
                    >
                      Confirm payment
                    </OsButton>
                    <OsButton
                      variant="ghost"
                      disabled={payBusy === payment.id}
                      onClick={() => {
                        setRejectingId(payment.id);
                        setRejectReason("");
                      }}
                    >
                      Reject
                    </OsButton>
                  </div>
                  {rejectingId === payment.id ? (
                    <div className="space-y-2 rounded-xl border border-line bg-paper p-3">
                      <label className="block text-sm">
                        <span className="os-label">Reason for client</span>
                        <textarea
                          value={rejectReason}
                          onChange={(event) => setRejectReason(event.target.value)}
                          rows={3}
                          className="mt-1 w-full border border-line px-3 py-2 text-ink"
                          placeholder="e.g. Amount does not match / unclear receipt"
                        />
                      </label>
                      <OsButton
                        variant="ghost"
                        loading={payBusy === payment.id}
                        loadingText="Rejecting…"
                        onClick={() => void rejectTransfer(payment)}
                      >
                        Send rejection
                      </OsButton>
                    </div>
                  ) : null}
                </div>
                <div>
                  <p className="os-label mb-2">Payment receipt</p>
                  {receiptSrc(payment) ? (
                    <a href={receiptSrc(payment)} target="_blank" rel="noreferrer" className="block">
                      <img
                        src={receiptSrc(payment)}
                        alt="Bank transfer receipt"
                        className="max-h-80 w-full rounded-xl border border-line object-contain bg-paper"
                      />
                    </a>
                  ) : (
                    <p className="rounded-xl border border-dashed border-line px-4 py-12 text-center text-sm text-muted">
                      No receipt attached.
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      ) : null}

      {order.priceOnRequest ? (
        <SectionCard title="Send request-for-price quote">
          <p className="mb-3 text-sm text-muted">
            Set the full price, then email and/or WhatsApp the client. The message includes a pay link (full amount) and a
            cancel link.
          </p>
          <form className="grid gap-3 sm:grid-cols-2" onSubmit={(event) => void sendPrice(event)}>
            <Field label="Description">
              <input
                name="description"
                defaultValue={`Request for price · ${order.name}`}
                className={inputClass}
                disabled={priceBusy}
              />
            </Field>
            <Field label="Channel">
              <select name="channel" defaultValue="both" className={inputClass} disabled={priceBusy}>
                <option value="both">Email + WhatsApp</option>
                <option value="email">Email only</option>
                <option value="whatsapp">WhatsApp only</option>
              </select>
            </Field>
            <Field label="Total ₦ (full amount due)">
              <input
                name="total"
                type="number"
                min={1}
                step={1}
                required
                defaultValue={order.totalKobo > 0 ? order.totalKobo / 100 : ""}
                className={inputClass}
                disabled={priceBusy}
              />
            </Field>
            <div className="sm:col-span-2">
              <OsButton type="submit" variant="gold" loading={priceBusy} loadingText="Sending…">
                {awaitingPrice ? "Send price to client" : "Update & re-send price"}
              </OsButton>
            </div>
          </form>
          {order.quoteNumber ? (
            <p className="mt-3 text-sm text-muted">
              Latest quote {order.quoteNumber} · {statusLabel(order.quoteStatus ?? "sent")}
            </p>
          ) : null}
          {lastLinks ? (
            <div className="mt-4 space-y-1 break-all rounded-xl border border-line bg-paper/50 p-3 text-xs">
              <p>
                Pay:{" "}
                <a href={lastLinks.payUrl} className="underline" target="_blank" rel="noreferrer">
                  {lastLinks.payUrl}
                </a>
              </p>
              <p>
                Cancel:{" "}
                <a href={lastLinks.cancelUrl} className="underline" target="_blank" rel="noreferrer">
                  {lastLinks.cancelUrl}
                </a>
              </p>
              <a href={lastLinks.whatsappUrl} className="inline-block underline" target="_blank" rel="noreferrer">
                Open WhatsApp again
              </a>
            </div>
          ) : null}
        </SectionCard>
      ) : null}

      <SectionCard title="Progress">
        <OrderStepper
          key={`${order.status}-${prod?.stage ?? "none"}`}
          status={order.status}
          stage={prod?.stage}
          kind={order.kind}
          createdAt={order.createdAt}
        />
        {prod ? (
          <p className="mt-3 text-sm text-muted">
            Floor ticket · {stageLabel(prod.stage)} · due {prod.dueDate ?? "—"}
          </p>
        ) : (
          <p className="mt-3 text-sm text-muted">
            No floor ticket yet.
            {order.kind === "ready_to_wear"
              ? " Move status to In the atelier when ready to cut."
              : " Confirming full payment opens the floor board automatically for made-to-measure / bespoke."}
          </p>
        )}
      </SectionCard>
      <SectionCard title="Update status">
        <p className="mb-3 text-sm text-muted">
          Each change emails the client and keeps Production in sync.
          {!fullyPaid ? " Ready / dispatch / delivery stay locked until the balance is paid." : ""}
        </p>
        <div className="flex flex-wrap gap-2">
          {FLOW.map((status) => {
            const needsFullPay = ["ready", "dispatched", "delivered"].includes(status);
            const locked = needsFullPay && !fullyPaid;
            return (
              <OsButton
                key={status}
                variant={status === order.status ? "gold" : "ghost"}
                disabled={locked}
                onClick={() => {
                  if (locked) {
                    toast.error("Collect the remaining balance before this status.");
                    return;
                  }
                  void setStatus(status);
                }}
              >
                {statusLabel(status)}
                {locked ? " · pay first" : ""}
              </OsButton>
            );
          })}
          <OsButton
            variant={order.status === "cancelled" ? "danger" : "ghost"}
            onClick={() => void setStatus("cancelled")}
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
              <span>
                {order.priceOnRequest && (item.unitKobo ?? 0) <= 0
                  ? "Request for price"
                  : formatNaira((item.unitKobo ?? 0) * (item.qty ?? 1))}
              </span>
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
