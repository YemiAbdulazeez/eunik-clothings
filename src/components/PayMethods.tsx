import { type FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import LoadingButton from "@/components/LoadingButton";
import ImageUpload from "@/components/os/ImageUpload";
import { db } from "@/db/database";
import { useAsync } from "@/hooks/useAsync";
import { formatNaira } from "@/lib/money";
import { HTTP_ENABLED } from "@/api/http";

export type PayChoice =
  | { method: "paystack" }
  | { method: "bank_transfer"; transactionNumber: string; receiptUrl: string };

export default function PayMethods({
  amountKobo,
  onPay,
  busy,
  disabled = false,
  placeOnly = false,
}: {
  amountKobo: number;
  onPay: (choice: PayChoice) => Promise<void>;
  busy: boolean;
  disabled?: boolean;
  /** Request-for-price / ₦0 — place the order without collecting payment */
  placeOnly?: boolean;
}) {
  const { data: settings } = useAsync(() => db.settings.get(), []);
  const paystackOn = Boolean(settings?.paystackEnabled);
  const [method, setMethod] = useState<"paystack" | "bank_transfer">("bank_transfer");
  const [receiptUrl, setReceiptUrl] = useState("");
  const livePaystack =
    paystackOn &&
    HTTP_ENABLED &&
    Boolean(import.meta.env.VITE_PAYSTACK_PUBLIC_KEY) &&
    !String(import.meta.env.VITE_PAYSTACK_PUBLIC_KEY).includes("...");

  useEffect(() => {
    if (!paystackOn) setMethod("bank_transfer");
  }, [paystackOn]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (placeOnly) {
      await onPay({ method: "paystack" });
      return;
    }
    if (method === "paystack") {
      if (!paystackOn) {
        toast.error("Paystack is not available. Use bank transfer.");
        return;
      }
      await onPay({ method: "paystack" });
      return;
    }
    const data = new FormData(event.currentTarget);
    const transactionNumber = String(data.get("txn") ?? "").trim();
    if (!transactionNumber) {
      toast.error("Enter the bank transaction number.");
      return;
    }
    if (!receiptUrl) {
      toast.error("Upload a receipt image of the transfer.");
      return;
    }
    await onPay({ method: "bank_transfer", transactionNumber, receiptUrl });
  }

  if (placeOnly) {
    return (
      <form onSubmit={(event) => void submit(event)} className="space-y-5">
        <p className="rounded-xl bg-gold/30 px-4 py-3 text-sm text-ink">
          No payment is due now. Place the order and the house will confirm pricing by email.
        </p>
        <LoadingButton type="submit" loading={busy} disabled={disabled} loadingText="Placing…" className="w-full">
          Place order
        </LoadingButton>
      </form>
    );
  }

  const bankPanel = (
    <div className="space-y-4 rounded-xl border border-line p-4 text-sm">
      <div>
        <p className="os-label">Transfer to</p>
        <p className="mt-1 font-medium text-ink">{settings?.bank.bankName}</p>
        <p>{settings?.bank.accountName}</p>
        <p className="font-alt text-2xl tracking-wide text-ink">{settings?.bank.accountNumber}</p>
        {settings?.bank.narrationHint ? <p className="mt-1 text-muted">{settings.bank.narrationHint}</p> : null}
      </div>
      <label className="block">
        <span className="os-label">Transaction number</span>
        <input name="txn" required className="mt-1 w-full border border-line px-3 py-2 text-ink" placeholder="Bank reference / session ID" />
      </label>
      <ImageUpload label="Payment receipt" folder="receipts" compact value={receiptUrl} onChange={setReceiptUrl} />
          <p className="text-xs text-muted">Upload a clear photo of the transfer confirmation (jpg, png, or webp · max 2MB).</p>
    </div>
  );

  return (
    <form onSubmit={(event) => void submit(event)} className="space-y-5">
      {paystackOn ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setMethod("paystack")}
            className={`rounded-2xl border p-4 text-left transition-colors hover:border-ink ${method === "paystack" ? "border-ink bg-paper" : "border-line"}`}
          >
            <p className="font-medium text-ink">Paystack</p>
            <p className="text-sm">{livePaystack ? "Card, transfer, or USSD in a secure popup." : "Demo — no card is charged."}</p>
          </button>
          <button
            type="button"
            onClick={() => setMethod("bank_transfer")}
            className={`rounded-2xl border p-4 text-left transition-colors hover:border-ink ${method === "bank_transfer" ? "border-ink bg-paper" : "border-line"}`}
          >
            <p className="font-medium text-ink">Bank transfer</p>
            <p className="text-sm">Send to the account, then attach txn number + receipt.</p>
          </button>
        </div>
      ) : (
        <p className="rounded-xl border border-line bg-paper/60 px-4 py-3 text-sm text-ink">
          Pay by bank transfer only. Send the exact amount to the house account, then attach your transaction number and receipt.
        </p>
      )}

      {method === "paystack" && paystackOn ? (
        <p className="rounded-xl bg-gold/30 px-4 py-3 text-sm text-ink">
          {livePaystack
            ? `You will pay ${formatNaira(amountKobo)} in the Paystack window.`
            : `Demo checkout — no card is charged. We will record ${formatNaira(amountKobo)} with a PAY_demo reference.`}
        </p>
      ) : (
        bankPanel
      )}

      <LoadingButton
        type="submit"
        loading={busy}
        disabled={disabled || (method === "bank_transfer" && !receiptUrl)}
        loadingText={method === "paystack" ? "Opening Paystack…" : "Submitting…"}
        className="w-full"
      >
        {method === "bank_transfer"
          ? `I have paid ${formatNaira(amountKobo)} and the details have been attached`
          : `Pay ${formatNaira(amountKobo)}`}
      </LoadingButton>
    </form>
  );
}
