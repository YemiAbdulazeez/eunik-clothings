import { formatNaira } from "@/lib/money";

export type DocumentLine = {
  description: string;
  quantity: number;
  unitKobo: number;
};

export type DocumentVariant = "quote" | "proforma" | "receipt";

export type DocumentData = {
  variant: DocumentVariant;
  number: string;
  issuedAt: string;
  billTo: string;
  payableTo: string;
  lines: DocumentLine[];
  note?: string;
  bank?: { bankName: string; accountName: string; accountNumber: string };
  house?: { name: string; address: string; phone: string };
  paidStamp?: boolean;
  depositKobo?: number;
};

const TITLES: Record<DocumentVariant, string> = {
  quote: "QUOTATION",
  proforma: "PRO FORMA INVOICE",
  receipt: "PAYMENT RECEIPT",
};

function formatIssued(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB");
}

export function documentGrandTotal(lines: DocumentLine[]) {
  return lines.reduce((sum, line) => sum + line.quantity * line.unitKobo, 0);
}

/** Printable quote / pro forma / receipt — layout from inv.html, house tokens. */
export default function DocumentSheet({ data }: { data: DocumentData }) {
  const total = documentGrandTotal(data.lines);
  return (
    <div className="document-sheet mx-auto w-full max-w-[800px] overflow-hidden bg-white shadow-md print:shadow-none">
      <div className="relative flex min-h-[120px] items-center overflow-hidden bg-ink px-6 py-5 text-white sm:px-8">
        <div className="z-10 mr-6 flex h-[100px] w-[140px] shrink-0 items-center justify-center bg-white p-2">
          <img src="/images/eunik.png" alt="EUNIK" className="max-h-full w-auto object-contain" />
        </div>
        <div className="z-10 flex-1">
          <h1 className="font-alt text-2xl font-light tracking-[0.12em] sm:text-3xl">{TITLES[data.variant]}</h1>
          <div className="mt-3 flex flex-wrap gap-6 text-sm sm:text-base">
            <span>Issued: {formatIssued(data.issuedAt)}</span>
            <span>
              {data.variant === "receipt" ? "Receipt" : data.variant === "quote" ? "Quote" : "Invoice"}#
              {data.number}
            </span>
          </div>
        </div>
        <div
          className="pointer-events-none absolute -right-4 -top-10 h-48 w-40 rounded-full border-[22px] border-gold/70 opacity-80"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute right-10 -top-16 h-36 w-44 rounded-full border-[20px] border-white/20 opacity-70"
          aria-hidden
        />
      </div>

      <div className="p-6 sm:p-8">
        {data.paidStamp ? (
          <p className="mb-4 inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-green-800">
            Paid
          </p>
        ) : null}

        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <div className="min-h-[100px] border-t-4 border-[#ff3b94] bg-paper p-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#ff9d6c]">Bill to</p>
            <p className="font-alt text-2xl font-semibold text-ink">{data.billTo || "—"}</p>
          </div>
          <div className="min-h-[100px] border-t-4 border-[#ff3b94] bg-paper p-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#ff9d6c]">Payable to</p>
            <p className="text-sm font-bold text-ink">{data.payableTo}</p>
          </div>
        </div>

        <table className="mb-3 w-full border-collapse text-sm">
          <thead>
            <tr className="bg-[#ffc09f] text-left text-ink">
              <th className="px-3 py-3">Description</th>
              <th className="px-3 py-3 text-center">Qty</th>
              <th className="px-3 py-3 text-center">Price</th>
              <th className="px-3 py-3 text-center">Total</th>
            </tr>
          </thead>
          <tbody>
            {data.lines.map((line, i) => {
              const lineTotal = line.quantity * line.unitKobo;
              return (
                <tr key={`${line.description}-${i}`} className="border-b border-line">
                  <td className="px-3 py-3 text-ink">{line.description || "—"}</td>
                  <td className="bg-paper px-3 py-3 text-center">{line.quantity}</td>
                  <td className="bg-paper px-3 py-3 text-center">{formatNaira(line.unitKobo)}</td>
                  <td className="bg-paper px-3 py-3 text-center">{formatNaira(lineTotal)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="mb-6 flex items-center justify-between bg-ink px-5 py-4 text-white">
          <span className="font-alt text-xl font-bold tracking-wide sm:text-2xl">Grand total</span>
          <span className="font-alt text-xl font-bold sm:text-2xl">{formatNaira(total)}</span>
        </div>

        {data.depositKobo != null && data.depositKobo > 0 ? (
          <p className="mb-4 rounded-xl bg-gold/25 px-4 py-3 text-sm text-ink">
            Deposit due to start: <strong>{formatNaira(data.depositKobo)}</strong>
          </p>
        ) : null}

        {data.note ? <p className="mb-4 text-sm text-muted">{data.note}</p> : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="border-t-4 border-[#ff3b94] bg-[#ffc09f] p-4 text-sm text-ink">
            <p>Thank you for your business.</p>
            {data.bank ? (
              <>
                <p className="mt-3 text-base font-semibold">Account details</p>
                <p>{data.bank.bankName}</p>
                <p>{data.bank.accountNumber}</p>
                <p>{data.bank.accountName}</p>
              </>
            ) : null}
          </div>
          <div className="border-t-4 border-[#ff3b94] bg-[#ffc09f] p-4 text-sm text-ink">
            <p className="font-semibold">{data.house?.name ?? data.payableTo}</p>
            {data.house?.address ? <p className="mt-1">{data.house.address}</p> : null}
            {data.house?.phone ? <p className="mt-1">{data.house.phone}</p> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
