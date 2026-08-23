import { Plus, Printer, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import DocumentSheet, {
  documentGrandTotal,
  type DocumentLine,
  type DocumentVariant,
} from "@/components/DocumentSheet";
import LoadingButton from "@/components/LoadingButton";
import { Field, inputClass } from "@/components/os/ui";
import { nairaToKobo } from "@/lib/money";

export type QuoteDraft = {
  billTo: string;
  payableTo: string;
  number: string;
  issuedAt: string;
  lines: DocumentLine[];
  depositNaira: number;
  note: string;
  variant: DocumentVariant;
};

export function linesToDescription(lines: DocumentLine[]) {
  return lines
    .filter((l) => l.description.trim())
    .map((l) => `${l.quantity}× ${l.description.trim()} @ ₦${(l.unitKobo / 100).toLocaleString("en-NG")}`)
    .join("; ");
}

export default function QuoteComposer({
  initial,
  bank,
  house,
  submitLabel = "Send quote",
  loadingText = "Sending…",
  onSubmit,
}: {
  initial: QuoteDraft;
  bank?: { bankName: string; accountName: string; accountNumber: string };
  house?: { name: string; address: string; phone: string };
  submitLabel?: string;
  loadingText?: string;
  onSubmit: (payload: {
    description: string;
    totalKobo: number;
    depositKobo: number;
    draft: QuoteDraft;
  }) => Promise<void>;
}) {
  const [draft, setDraft] = useState<QuoteDraft>(initial);
  const [busy, setBusy] = useState(false);
  const totalKobo = useMemo(() => documentGrandTotal(draft.lines), [draft.lines]);

  function updateLine(index: number, patch: Partial<DocumentLine>) {
    setDraft((prev) => ({
      ...prev,
      lines: prev.lines.map((line, i) => (i === index ? { ...line, ...patch } : line)),
    }));
  }

  function addLine() {
    setDraft((prev) => ({
      ...prev,
      lines: [...prev.lines, { description: "", quantity: 1, unitKobo: 0 }],
    }));
  }

  function removeLine(index: number) {
    setDraft((prev) => ({
      ...prev,
      lines: prev.lines.length <= 1 ? prev.lines : prev.lines.filter((_, i) => i !== index),
    }));
  }

  async function send() {
    if (!draft.billTo.trim()) return;
    if (!draft.lines.some((l) => l.description.trim() && l.unitKobo > 0)) return;
    setBusy(true);
    try {
      await onSubmit({
        description: linesToDescription(draft.lines) || draft.note,
        totalKobo,
        depositKobo: nairaToKobo(draft.depositNaira),
        draft,
      });
    } finally {
      setBusy(false);
    }
  }

  function printPreview() {
    window.print();
  }

  return (
    <div className="grid gap-8 xl:grid-cols-2">
      <div className="space-y-4 rounded-2xl border border-line bg-white p-5 print:hidden">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Document type">
            <select
              className={inputClass}
              value={draft.variant}
              onChange={(e) => setDraft((d) => ({ ...d, variant: e.target.value as DocumentVariant }))}
            >
              <option value="quote">Quotation</option>
              <option value="proforma">Pro forma invoice</option>
              <option value="receipt">Receipt</option>
            </select>
          </Field>
          <Field label="Document #">
            <input
              className={inputClass}
              value={draft.number}
              onChange={(e) => setDraft((d) => ({ ...d, number: e.target.value }))}
            />
          </Field>
          <Field label="Bill to">
            <input
              className={inputClass}
              value={draft.billTo}
              onChange={(e) => setDraft((d) => ({ ...d, billTo: e.target.value }))}
            />
          </Field>
          <Field label="Payable to">
            <input
              className={inputClass}
              value={draft.payableTo}
              onChange={(e) => setDraft((d) => ({ ...d, payableTo: e.target.value }))}
            />
          </Field>
          <Field label="Issued">
            <input
              type="date"
              className={inputClass}
              value={draft.issuedAt.slice(0, 10)}
              onChange={(e) => setDraft((d) => ({ ...d, issuedAt: e.target.value }))}
            />
          </Field>
          <Field label="Deposit ₦">
            <input
              type="number"
              min={0}
              className={inputClass}
              value={draft.depositNaira}
              onChange={(e) => setDraft((d) => ({ ...d, depositNaira: Number(e.target.value) || 0 }))}
            />
          </Field>
        </div>

        <div className="space-y-3">
          <p className="os-label">Line items</p>
          {draft.lines.map((line, index) => (
            <div key={index} className="grid gap-2 rounded-xl border border-line p-3 sm:grid-cols-[1fr_80px_120px_auto]">
              <input
                className={inputClass}
                placeholder="Description"
                value={line.description}
                onChange={(e) => updateLine(index, { description: e.target.value })}
              />
              <input
                type="number"
                min={1}
                className={inputClass}
                value={line.quantity}
                onChange={(e) => updateLine(index, { quantity: Math.max(1, Number(e.target.value) || 1) })}
              />
              <input
                type="number"
                min={0}
                className={inputClass}
                placeholder="Price ₦"
                value={line.unitKobo ? line.unitKobo / 100 : ""}
                onChange={(e) => updateLine(index, { unitKobo: nairaToKobo(Number(e.target.value) || 0) })}
              />
              <button
                type="button"
                aria-label="Remove line"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line text-ink transition-colors hover:border-ink hover:bg-paper"
                onClick={() => removeLine(index)}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addLine}
            className="inline-flex items-center gap-2 text-sm text-ink underline-offset-4 hover:underline"
          >
            <Plus className="h-4 w-4" /> Add line
          </button>
        </div>

        <Field label="Note (shown on document)">
          <textarea
            className={inputClass}
            rows={2}
            value={draft.note}
            onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value }))}
          />
        </Field>

        <div className="flex flex-wrap gap-2">
          <LoadingButton loading={busy} loadingText={loadingText} variant="gold" onClick={() => void send()}>
            {submitLabel}
          </LoadingButton>
          <LoadingButton variant="ghost" onClick={printPreview}>
            <Printer className="h-4 w-4" /> Print preview
          </LoadingButton>
        </div>
      </div>

      <div className="overflow-auto">
        <DocumentSheet
          data={{
            variant: draft.variant,
            number: draft.number,
            issuedAt: draft.issuedAt,
            billTo: draft.billTo,
            payableTo: draft.payableTo,
            lines: draft.lines,
            note: draft.note,
            bank,
            house,
            depositKobo: nairaToKobo(draft.depositNaira),
          }}
        />
      </div>
    </div>
  );
}
