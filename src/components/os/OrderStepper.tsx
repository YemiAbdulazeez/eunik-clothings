import { Check } from "lucide-react";
import type { OrderStatus, ProductionStage } from "@/db/types";

const RTW = [
  { key: "confirmed", label: "Confirmed" },
  { key: "processing", label: "Packed" },
  { key: "ready", label: "Ready" },
  { key: "dispatched", label: "On the way" },
  { key: "delivered", label: "Delivered" },
] as const;

const ATELIER = [
  { key: "deposit_paid", label: "Deposit" },
  { key: "measurements_confirmed", label: "Tape" },
  { key: "cutting", label: "Cutting" },
  { key: "sewing", label: "Sewing" },
  { key: "finishing", label: "Finishing" },
  { key: "first_fitting", label: "Fitting" },
  { key: "quality_check", label: "QC" },
  { key: "ready", label: "Ready" },
] as const;

const STATUS_INDEX: Record<string, number> = {
  pending_payment: 0,
  awaiting_transfer: 0,
  confirmed: 0,
  processing: 1,
  production: 2,
  ready: 2,
  dispatched: 3,
  delivered: 4,
  cancelled: -1,
};

const STAGE_INDEX: Record<string, number> = {
  quote_accepted: 0,
  deposit_paid: 0,
  design_confirmed: 0,
  fabric_confirmed: 0,
  measurements_confirmed: 1,
  cutting: 2,
  sewing: 3,
  finishing: 4,
  first_fitting: 5,
  alterations: 5,
  final_fitting: 5,
  quality_check: 6,
  ready: 7,
  completed: 7,
};

export default function OrderStepper({
  status,
  stage,
  kind,
}: {
  status: OrderStatus;
  stage?: ProductionStage | null;
  kind: string;
}) {
  const atelier = kind !== "ready_to_wear" && Boolean(stage);
  const steps = atelier ? ATELIER : RTW;
  const current = atelier ? (STAGE_INDEX[stage ?? ""] ?? 0) : (STATUS_INDEX[status] ?? 0);
  if (status === "cancelled") {
    return <p className="text-sm text-[var(--destructive)]">This ticket was cancelled.</p>;
  }

  return (
    <ol className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-8">
      {steps.map((step, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li
            key={step.key}
            className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs ${
              active ? "border-gold bg-gold/20 text-ink" : done ? "border-ink bg-ink text-white" : "border-line text-muted"
            }`}
          >
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                done || active ? "bg-gold text-ink" : "bg-paper"
              }`}
            >
              {done ? <Check className="h-3.5 w-3.5" /> : index + 1}
            </span>
            <span className="font-medium leading-tight">{step.label}</span>
          </li>
        );
      })}
    </ol>
  );
}
