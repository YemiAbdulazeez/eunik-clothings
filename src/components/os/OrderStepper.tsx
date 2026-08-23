import { Check, Circle, Package, Truck } from "lucide-react";
import type { OrderStatus, ProductionStage } from "@/db/types";
import { ORDER_STATUS_LABEL, STAGE_LABEL } from "@/lib/statusLabels";

type StepDef = {
  keys: readonly string[];
  label: string;
  detail: string;
};

/** Client-facing logistics — Temu-style vertical journey */
const CLIENT_STEPS: StepDef[] = [
  {
    keys: ["pending_payment", "awaiting_transfer"],
    label: ORDER_STATUS_LABEL.pending_payment,
    detail: "We’re waiting for your Paystack payment or bank transfer to clear.",
  },
  {
    keys: ["confirmed", "processing"],
    label: ORDER_STATUS_LABEL.confirmed,
    detail: "Payment received. The house is preparing your order.",
  },
  {
    keys: ["production"],
    label: ORDER_STATUS_LABEL.production,
    detail: "Your look is on the atelier floor — cutting, sewing, or finishing.",
  },
  {
    keys: ["ready"],
    label: ORDER_STATUS_LABEL.ready,
    detail: "Ready for pickup in Ibadan or hand-over to the courier.",
  },
  {
    keys: ["dispatched"],
    label: ORDER_STATUS_LABEL.dispatched,
    detail: "Your package is on the way. Keep your phone reachable for delivery.",
  },
  {
    keys: ["delivered"],
    label: ORDER_STATUS_LABEL.delivered,
    detail: "Delivered or collected. Enjoy your EUNIK look.",
  },
];

const ATELIER_STEPS: StepDef[] = [
  {
    keys: ["quote_accepted", "deposit_paid", "design_confirmed", "fabric_confirmed"],
    label: STAGE_LABEL.deposit_paid,
    detail: "Deposit and design brief locked in.",
  },
  {
    keys: ["measurements_confirmed"],
    label: STAGE_LABEL.measurements_confirmed,
    detail: "Measurements confirmed for the floor.",
  },
  {
    keys: ["cutting"],
    label: STAGE_LABEL.cutting,
    detail: "Fabric is being cut to your pattern.",
  },
  {
    keys: ["sewing"],
    label: STAGE_LABEL.sewing,
    detail: "Tailors are sewing your garment.",
  },
  {
    keys: ["finishing"],
    label: STAGE_LABEL.finishing,
    detail: "Finishing touches — hems, press, and detail work.",
  },
  {
    keys: ["first_fitting", "alterations", "final_fitting"],
    label: STAGE_LABEL.first_fitting,
    detail: "Fitting and alterations in progress.",
  },
  {
    keys: ["quality_check"],
    label: STAGE_LABEL.quality_check,
    detail: "Quality check before release.",
  },
  {
    keys: ["ready", "completed"],
    label: STAGE_LABEL.ready,
    detail: "Ready for collection or dispatch.",
  },
];

function stepIndex(steps: readonly StepDef[], value: string | undefined): number {
  if (!value) return 0;
  const found = steps.findIndex((step) => step.keys.includes(value));
  return found === -1 ? 0 : found;
}

function resolveSteps(status: OrderStatus, stage: ProductionStage | null | undefined, kind: string) {
  const onFloor = kind !== "ready_to_wear" && Boolean(stage) && status === "production";
  const steps = onFloor ? ATELIER_STEPS : CLIENT_STEPS;
  const current = onFloor ? stepIndex(ATELIER_STEPS, stage ?? undefined) : stepIndex(CLIENT_STEPS, status);
  return { steps, current, onFloor };
}

export function trackingHeadline(status: OrderStatus, stage?: ProductionStage | null, kind = "ready_to_wear") {
  if (status === "cancelled") return { title: "Order cancelled", detail: "This order was cancelled by the house or the client." };
  const { steps, current } = resolveSteps(status, stage, kind);
  const step = steps[current] ?? steps[0];
  return { title: step.label, detail: step.detail };
}

/** Temu-style vertical logistics tracker */
export default function OrderStepper({
  status,
  stage,
  kind,
  compact = false,
  createdAt,
}: {
  status: OrderStatus;
  stage?: ProductionStage | null;
  kind: string;
  compact?: boolean;
  createdAt?: string;
}) {
  if (status === "cancelled") {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        This order was cancelled.
      </div>
    );
  }

  const { steps, current } = resolveSteps(status, stage, kind);
  const placedLabel = createdAt
    ? new Date(createdAt).toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className={compact ? "pt-1" : "pt-2"}>
      <ol className="relative ml-2 space-y-0 border-l-2 border-line pl-6">
        {steps.map((step, index) => {
          const done = index < current;
          const active = index === current;
          const upcoming = index > current;
          return (
            <li key={`${step.label}-${index}`} className="relative pb-7 last:pb-0">
              <span
                className={`absolute -left-[31px] top-0 flex h-7 w-7 items-center justify-center rounded-full border-2 ${
                  done
                    ? "border-ink bg-ink text-white"
                    : active
                      ? "border-gold bg-gold text-ink shadow-[0_0_0_4px_rgba(238,177,103,0.25)]"
                      : "border-line bg-white text-muted"
                }`}
                aria-hidden
              >
                {done ? (
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                ) : active ? (
                  index >= steps.length - 2 ? (
                    <Truck className="h-3.5 w-3.5" />
                  ) : (
                    <Package className="h-3.5 w-3.5" />
                  )
                ) : (
                  <Circle className="h-2.5 w-2.5 fill-current" />
                )}
              </span>
              <div className={upcoming ? "opacity-45" : ""}>
                <p
                  className={`font-alt text-base leading-tight sm:text-lg ${
                    active ? "font-semibold text-ink" : done ? "font-medium text-ink" : "text-muted"
                  }`}
                >
                  {step.label}
                </p>
                {!compact || active ? (
                  <p className={`mt-1 text-sm leading-6 ${active ? "text-ink/80" : "text-muted"}`}>{step.detail}</p>
                ) : null}
                {active && placedLabel && index === 0 ? (
                  <p className="mt-1 text-xs text-muted">Placed · {placedLabel}</p>
                ) : null}
                {active ? (
                  <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-gold/30 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-ink">
                    Current
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
