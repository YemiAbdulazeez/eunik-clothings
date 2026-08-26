import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { OsButton, SectionCard } from "@/components/os/ui";
import { db, type Product } from "@/db/database";
import { useAsync } from "@/hooks/useAsync";
import { formatNaira } from "@/lib/money";
import { useSession } from "@/context/SessionProvider";

type LineDraft = {
  key: string;
  mode: "catalogue" | "custom";
  productId: string;
  name: string;
  sku: string;
  qty: number;
  unitNaira: string;
};

const emptyLine = (): LineDraft => ({
  key: crypto.randomUUID(),
  mode: "catalogue",
  productId: "",
  name: "",
  sku: "",
  qty: 1,
  unitNaira: "",
});

const inputClass =
  "w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ink";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
};

export default function StudioManualOrderForm({ open, onClose, onCreated }: Props) {
  const navigate = useNavigate();
  const { user } = useSession();
  const { data: products } = useAsync(() => db.products.listAll(), []);
  const [busy, setBusy] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [kind, setKind] = useState<"ready_to_wear" | "made_to_measure" | "bespoke" | "alteration">(
    "ready_to_wear",
  );
  const [source, setSource] = useState<"whatsapp" | "phone" | "walk_in">("whatsapp");
  const [fulfillment, setFulfillment] = useState<"pickup_ibadan" | "delivery">("pickup_ibadan");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("confirmed");
  const [paidNaira, setPaidNaira] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "pos" | "offline" | "bank_transfer">(
    "cash",
  );
  const [paymentRef, setPaymentRef] = useState("");
  const [notifyClient, setNotifyClient] = useState(false);
  const [lines, setLines] = useState<LineDraft[]>([emptyLine()]);

  const catalogue = useMemo(
    () => [...(products ?? [])].sort((a, b) => a.sku.localeCompare(b.sku)),
    [products],
  );

  if (!open) return null;

  function updateLine(key: string, patch: Partial<LineDraft>) {
    setLines((prev) => prev.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  }

  function pickProduct(key: string, product: Product | undefined) {
    if (!product) {
      updateLine(key, { productId: "", name: "", sku: "", unitNaira: "" });
      return;
    }
    updateLine(key, {
      productId: product.id,
      name: product.name,
      sku: product.sku,
      unitNaira: product.priceOnRequest ? "0" : String(Math.round(product.priceKobo / 100)),
    });
  }

  async function submit() {
    if (busy) return;
    if (!customerName.trim() || !customerEmail.trim()) {
      toast.error("Client name and email are required.");
      return;
    }
    const payloadLines = lines
      .map((line) => {
        const unitKobo = Math.max(0, Math.round(Number(line.unitNaira || 0) * 100));
        if (line.mode === "catalogue") {
          if (!line.productId) return null;
          return {
            productId: line.productId,
            name: line.name || undefined,
            sku: line.sku || undefined,
            qty: Math.max(1, line.qty),
            unitKobo,
            kind: (kind === "ready_to_wear" ? "rtw" : "mtm") as "rtw" | "mtm",
          };
        }
        if (!line.name.trim()) return null;
        return {
          name: line.name.trim(),
          sku: line.sku.trim() || undefined,
          qty: Math.max(1, line.qty),
          unitKobo,
          kind: (kind === "ready_to_wear" ? "rtw" : "mtm") as "rtw" | "mtm",
        };
      })
      .filter(Boolean) as {
      productId?: string;
      name?: string;
      sku?: string;
      qty: number;
      unitKobo: number;
      kind: "rtw" | "mtm";
    }[];

    if (!payloadLines.length) {
      toast.error("Add at least one catalogue or custom line.");
      return;
    }

    try {
      setBusy(true);
      const result = await db.orders.createManual({
        customer: {
          name: customerName.trim(),
          email: customerEmail.trim(),
          phone: customerPhone.trim() || undefined,
        },
        kind,
        source,
        fulfillment,
        address: fulfillment === "delivery" ? address.trim() || undefined : undefined,
        notes: notes.trim() || undefined,
        status: status as
          | "pending_payment"
          | "awaiting_transfer"
          | "confirmed"
          | "processing"
          | "production",
        paidKobo: Math.max(0, Math.round(Number(paidNaira || 0) * 100)),
        paymentMethod: Math.round(Number(paidNaira || 0) * 100) > 0 ? paymentMethod : undefined,
        paymentRef: paymentRef.trim() || undefined,
        shippingKobo: 0,
        notifyClient,
        lines: payloadLines,
      });
      toast.success(`Order ${result.orderNumber} saved.`);
      onCreated();
      onClose();
      navigate(`/studio/orders/${result.orderId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create the order.");
    } finally {
      setBusy(false);
    }
  }

  const canKeyIn =
    user?.role === "super_admin" || user?.role === "manager" || user?.role === "desk";
  if (!canKeyIn) return null;

  return (
    <SectionCard className="border-ink/20">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="os-label">Manual entry</p>
          <h2 className="font-alt text-2xl text-ink">Key in an offline order</h2>
          <p className="mt-1 max-w-xl text-sm text-muted">
            Use this when a client ordered on WhatsApp, by phone, or in person — same order book as
            website checkouts.
          </p>
        </div>
        <OsButton variant="ghost" onClick={onClose}>
          Close
        </OsButton>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="text-muted">Client name</span>
          <input className={inputClass} value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-muted">Email</span>
          <input
            type="email"
            className={inputClass}
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-muted">Phone</span>
          <input className={inputClass} value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-muted">How they ordered</span>
          <select className={inputClass} value={source} onChange={(e) => setSource(e.target.value as typeof source)}>
            <option value="whatsapp">WhatsApp (manual entry)</option>
            <option value="phone">Phone (manual entry)</option>
            <option value="walk_in">Walk-in (manual entry)</option>
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-muted">Order kind</span>
          <select className={inputClass} value={kind} onChange={(e) => setKind(e.target.value as typeof kind)}>
            <option value="ready_to_wear">Ready to wear</option>
            <option value="made_to_measure">Made to measure</option>
            <option value="bespoke">Bespoke</option>
            <option value="alteration">Alteration</option>
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-muted">Status</span>
          <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="confirmed">Confirmed</option>
            <option value="awaiting_transfer">Awaiting transfer</option>
            <option value="pending_payment">Pending payment</option>
            <option value="processing">Processing</option>
            <option value="production">In production</option>
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-muted">Fulfillment</span>
          <select
            className={inputClass}
            value={fulfillment}
            onChange={(e) => setFulfillment(e.target.value as typeof fulfillment)}
          >
            <option value="pickup_ibadan">Pickup · Ibadan HQ</option>
            <option value="delivery">Delivery</option>
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-muted">Already paid (₦)</span>
          <input
            className={inputClass}
            inputMode="decimal"
            placeholder="0 — deposit or full"
            value={paidNaira}
            onChange={(e) => setPaidNaira(e.target.value)}
          />
          <p className="text-xs text-muted">
            Leave 0 if unpaid. Partial = deposit with balance due later.
          </p>
        </label>
        {Number(paidNaira || 0) > 0 ? (
          <>
            <label className="space-y-1 text-sm">
              <span className="text-muted">How they paid</span>
              <select
                className={inputClass}
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as typeof paymentMethod)}
              >
                <option value="cash">Cash</option>
                <option value="pos">POS</option>
                <option value="bank_transfer">Bank transfer (already received)</option>
                <option value="offline">Offline / other</option>
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-muted">Payment ref (optional)</span>
              <input
                className={inputClass}
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
                placeholder="POS slip / transfer ref"
              />
            </label>
          </>
        ) : null}
      </div>

      {fulfillment === "delivery" ? (
        <>
          <label className="mt-4 block space-y-1 text-sm">
            <span className="text-muted">Delivery address</span>
            <input className={inputClass} value={address} onChange={(e) => setAddress(e.target.value)} />
          </label>
          <p className="mt-2 rounded-xl border border-line bg-paper/50 px-3 py-2 text-xs leading-5 text-muted">
            No shipping fee on the order. The client settles any dispatch rider or courier themselves.
          </p>
        </>
      ) : null}

      <label className="mt-4 block space-y-1 text-sm">
        <span className="text-muted">Internal notes</span>
        <textarea
          className={`${inputClass} min-h-[72px]`}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="WhatsApp thread summary, measurements promise, etc."
        />
      </label>

      <div className="mt-6 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-ink">Line items</h3>
          <OsButton
            variant="ghost"
            onClick={() => setLines((prev) => [...prev, emptyLine()])}
          >
            Add line
          </OsButton>
        </div>
        {lines.map((line) => {
          const product = catalogue.find((p) => p.id === line.productId);
          return (
            <div key={line.key} className="rounded-2xl border border-line bg-paper/40 p-3">
              <div className="mb-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className={`rounded-full px-3 py-1 text-xs ${line.mode === "catalogue" ? "bg-ink text-white" : "border border-line"}`}
                  onClick={() => updateLine(line.key, { mode: "catalogue" })}
                >
                  Catalogue look
                </button>
                <button
                  type="button"
                  className={`rounded-full px-3 py-1 text-xs ${line.mode === "custom" ? "bg-ink text-white" : "border border-line"}`}
                  onClick={() => updateLine(line.key, { mode: "custom", productId: "" })}
                >
                  Custom garment
                </button>
                {lines.length > 1 ? (
                  <button
                    type="button"
                    className="ml-auto text-xs text-muted underline"
                    onClick={() => setLines((prev) => prev.filter((row) => row.key !== line.key))}
                  >
                    Remove
                  </button>
                ) : null}
              </div>
              {line.mode === "catalogue" ? (
                <label className="mb-3 block space-y-1 text-sm">
                  <span className="text-muted">Product</span>
                  <select
                    className={inputClass}
                    value={line.productId}
                    onChange={(e) =>
                      pickProduct(
                        line.key,
                        catalogue.find((p) => p.id === e.target.value),
                      )
                    }
                  >
                    <option value="">Select a look…</option>
                    {catalogue.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.sku} · {p.name}
                        {p.priceOnRequest ? " · RFP" : ` · ${formatNaira(p.priceKobo)}`}
                      </option>
                    ))}
                  </select>
                  {product?.priceOnRequest ? (
                    <p className="text-xs text-muted">Request-for-price look — set the naira amount below.</p>
                  ) : null}
                </label>
              ) : (
                <div className="mb-3 grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1 text-sm">
                    <span className="text-muted">Garment name</span>
                    <input
                      className={inputClass}
                      value={line.name}
                      onChange={(e) => updateLine(line.key, { name: e.target.value })}
                    />
                  </label>
                  <label className="space-y-1 text-sm">
                    <span className="text-muted">SKU (optional)</span>
                    <input
                      className={inputClass}
                      value={line.sku}
                      onChange={(e) => updateLine(line.key, { sku: e.target.value })}
                    />
                  </label>
                </div>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1 text-sm">
                  <span className="text-muted">Qty</span>
                  <input
                    type="number"
                    min={1}
                    className={inputClass}
                    value={line.qty}
                    onChange={(e) => updateLine(line.key, { qty: Math.max(1, Number(e.target.value) || 1) })}
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="text-muted">Unit price (₦)</span>
                  <input
                    className={inputClass}
                    inputMode="decimal"
                    value={line.unitNaira}
                    onChange={(e) => updateLine(line.key, { unitNaira: e.target.value })}
                  />
                </label>
              </div>
            </div>
          );
        })}
      </div>

      <label className="mt-4 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={notifyClient}
          onChange={(e) => setNotifyClient(e.target.checked)}
        />
        Email the client an order confirmation
      </label>

      <div className="mt-6 flex flex-wrap gap-2">
        <OsButton loading={busy} loadingText="Saving…" onClick={() => void submit()}>
          Create order
        </OsButton>
        <OsButton variant="ghost" onClick={onClose}>
          Cancel
        </OsButton>
      </div>
    </SectionCard>
  );
}
