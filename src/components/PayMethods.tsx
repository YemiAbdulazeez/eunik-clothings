import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { db } from "@/db/database";
import { useAsync } from "@/hooks/useAsync";
import { formatNaira } from "@/lib/money";

export type PayChoice =
  | { method: "paystack" }
  | { method: "bank_transfer"; transactionNumber: string; receiptDataUrl: string };

export default function PayMethods({
  amountKobo,
  onPay,
  busy,
}: {
  amountKobo: number;
  onPay: (choice: PayChoice) => Promise<void>;
  busy: boolean;
}) {
  const { data: settings } = useAsync(() => db.settings.get(), []);
  const [method, setMethod] = useState<"paystack" | "bank_transfer">("paystack");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (method === "paystack") {
      await onPay({ method: "paystack" });
      return;
    }
    const data = new FormData(event.currentTarget);
    const transactionNumber = String(data.get("txn") ?? "").trim();
    const file = data.get("receipt");
    if (!transactionNumber) {
      toast.error("Enter the bank transaction number.");
      return;
    }
    if (!(file instanceof File) || file.size === 0) {
      toast.error("Upload a receipt image or PDF.");
      return;
    }
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowed.includes(file.type)) {
      toast.error("Receipt must be jpg, png, webp or pdf.");
      return;
    }
    const receiptDataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Could not read receipt."));
      reader.readAsDataURL(file);
    });
    await onPay({ method: "bank_transfer", transactionNumber, receiptDataUrl });
  }

  return (
    <form onSubmit={(event) => void submit(event)} className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setMethod("paystack")}
          className={`rounded-2xl border p-4 text-left ${method === "paystack" ? "border-ink bg-paper" : "border-line"}`}
        >
          <p className="font-medium text-ink">Paystack</p>
          <p className="text-sm">Demo — no card is charged.</p>
        </button>
        <button
          type="button"
          onClick={() => setMethod("bank_transfer")}
          className={`rounded-2xl border p-4 text-left ${method === "bank_transfer" ? "border-ink bg-paper" : "border-line"}`}
        >
          <p className="font-medium text-ink">Bank transfer</p>
          <p className="text-sm">Transaction number + receipt required.</p>
        </button>
      </div>

      {method === "paystack" ? (
        <p className="rounded-xl bg-gold/30 px-4 py-3 text-sm text-ink">
          Demo checkout — no card is charged. We will record {formatNaira(amountKobo)} with a PAY_demo reference.
        </p>
      ) : (
        <div className="space-y-3 rounded-xl border border-line p-4 text-sm">
          <p className="font-medium text-ink">{settings?.bank.bankName}</p>
          <p>{settings?.bank.accountName}</p>
          <p className="font-alt text-lg text-ink">{settings?.bank.accountNumber}</p>
          <p>{settings?.bank.narrationHint}</p>
          <label className="block">
            <span className="os-label">Transaction number</span>
            <input name="txn" required className="mt-1 w-full border border-line px-3 py-2 text-ink" />
          </label>
          <label className="block">
            <span className="os-label">Receipt (jpg, png, webp, pdf)</span>
            <input
              name="receipt"
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              required
              className="mt-1 w-full text-sm"
            />
          </label>
        </div>
      )}

      <button type="submit" disabled={busy} className="os-pill w-full bg-ink text-white disabled:opacity-60">
        {busy ? "Sending to the house…" : `Pay ${formatNaira(amountKobo)}`}
      </button>
    </form>
  );
}
