import { Check } from "lucide-react";
import type { OrderStatus, ProductionStage } from "@/db/types";
import { ORDER_STATUS_LABEL, STAGE_LABEL } from "@/lib/statusLabels";

/** Client-facing progress: Shop → pay → atelier → done */
const CLIENT_STEPS = [
  { keys: ["pending_payment", "awaiting_transfer"], label: ORDER_STATUS_LABEL.pending_payment },
  { keys: ["confirmed", "processing"], label: ORDER_STATUS_LABEL.confirmed },
  { keys: ["production"], label: ORDER_STATUS_LABEL.production },
  { keys: ["ready"], label: ORDER_STATUS_LABEL.ready },
  { keys: ["dispatched", "delivered"], label: ORDER_STATUS_LABEL.delivered },
] as const;

const ATELIER_STEPS = [
  { keys: ["quote_accepted", "deposit_paid", "design_confirmed", "fabric_confirmed"], label: STAGE_LABEL.deposit_paid },
  { keys: ["measurements_confirmed"], label: STAGE_LABEL.measurements_confirmed },
  { keys: ["cutting"], label: STAGE_LABEL.cutting },
  { keys: ["sewing"], label: STAGE_LABEL.sewing },
  { keys: ["finishing"], label: STAGE_LABEL.finishing },
  { keys: ["first_fitting", "alterations", "final_fitting"], label: STAGE_LABEL.first_fitting },
  { keys: ["quality_check"], label: STAGE_LABEL.quality_check },
  { keys: ["ready", "completed"], label: STAGE_LABEL.ready },
] as const;

function stepIndex(steps: readonly { keys: readonly string[] }[], value: string | undefined): number {
  if (!value) return 0;
  const found = steps.findIndex((step) => step.keys.includes(value));
  return found === -1 ? 0 : found;
}

export default function OrderStepper({
  status,
  stage,
  kind,
}: {
  status: OrderStatus;
  stage?: ProductionStage | null;
  kind: string;
}) {
  const onFloor = kind !== "ready_to_wear" && Boolean(stage) && status === "production";
  const steps = onFloor ? ATELIER_STEPS : CLIENT_STEPS;
  const current = onFloor ? stepIndex(ATELIER_STEPS, stage ?? undefined) : stepIndex(CLIENT_STEPS, status);

  if (status === "cancelled") {
    return <p className="text-sm text-[var(--destructive)]">This order was cancelled.</p>;
  }

  return (
    <ol className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-8">
      {steps.map((step, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li
            key={step.label}
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
