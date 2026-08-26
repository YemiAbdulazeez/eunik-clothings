/**
 * Plain-language labels for the three-door flow:
 * Shop · My account · House (Desk / Floor / Finance / Design)
 */

import type { OrderStatus, PaymentStatus, ProductionStage, Role } from "@/db/types";

/** Client-facing order status — short and clear */
export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending_payment: "Waiting for payment",
  awaiting_transfer: "Waiting for bank check",
  confirmed: "Confirmed",
  processing: "Being prepared",
  production: "In the atelier",
  ready: "Ready",
  dispatched: "On the way",
  delivered: "Done",
  cancelled: "Cancelled",
};

/** Payment ledger / finance */
export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  pending: "Waiting",
  awaiting_verification: "Waiting for bank check",
  successful: "Paid",
  failed: "Failed",
  rejected: "Rejected",
  refunded: "Refunded",
  partial: "Part paid",
};

/** Floor / production stages — staff and client share the same words */
export const STAGE_LABEL: Record<ProductionStage, string> = {
  quote_accepted: "Quote accepted",
  deposit_paid: "Deposit paid",
  design_confirmed: "Design set",
  fabric_confirmed: "Fabric set",
  measurements_confirmed: "Measurements set",
  cutting: "Cutting",
  sewing: "Sewing",
  finishing: "Finishing",
  first_fitting: "First fitting",
  alterations: "Alterations",
  final_fitting: "Final fitting",
  quality_check: "Quality check",
  ready: "Ready",
  completed: "Done",
};

export const QUOTE_STATUS_LABEL: Record<string, string> = {
  sent: "Waiting for you",
  accepted: "Accepted",
  rejected: "Closed",
  declined: "Declined",
  expired: "Expired",
};

export const REQUEST_STATUS_LABEL: Record<string, string> = {
  new: "New",
  quoted: "Quoted",
  closed: "Closed",
};

export const APPOINTMENT_STATUS_LABEL: Record<string, string> = {
  requested: "Requested",
  confirmed: "Confirmed",
  completed: "Done",
  cancelled: "Cancelled",
};

/** Staff role names shown in House UI */
export const ROLE_LABEL: Record<Role, string> = {
  client: "Client",
  super_admin: "Principal",
  manager: "Manager",
  desk: "Desk",
  designer: "Design",
  tailor: "Tailor",
  cutter: "Cutter",
  qc: "QC",
  finance: "Finance",
  content: "Content",
};

export const ORDER_KIND_LABEL: Record<string, string> = {
  ready_to_wear: "Ready to wear",
  made_to_measure: "Made to measure",
  bespoke: "Custom",
  alteration: "Alteration",
};

export const FULFILLMENT_LABEL: Record<string, string> = {
  pickup_ibadan: "Pickup in Ibadan",
  delivery: "Delivery",
};

function titleFromSnake(value: string): string {
  return value.replaceAll("_", " ");
}

/** Resolve any status / stage / role code to plain words */
export function statusLabel(value: string | null | undefined): string {
  if (!value) return "";
  return (
    ORDER_STATUS_LABEL[value as OrderStatus] ??
    PAYMENT_STATUS_LABEL[value as PaymentStatus] ??
    STAGE_LABEL[value as ProductionStage] ??
    QUOTE_STATUS_LABEL[value] ??
    REQUEST_STATUS_LABEL[value] ??
    APPOINTMENT_STATUS_LABEL[value] ??
    ORDER_KIND_LABEL[value] ??
    FULFILLMENT_LABEL[value] ??
    ROLE_LABEL[value as Role] ??
    titleFromSnake(value)
  );
}

export function roleLabel(role: Role | string): string {
  return ROLE_LABEL[role as Role] ?? titleFromSnake(role);
}

export function orderKindLabel(kind: string): string {
  return ORDER_KIND_LABEL[kind] ?? titleFromSnake(kind);
}

const ORDER_SOURCE_LABEL: Record<string, string> = {
  online: "Website",
  offline: "Keyed in (manual entry)",
  manual: "Keyed in (manual entry)",
  whatsapp: "WhatsApp (manual entry)",
  phone: "Phone (manual entry)",
  walk_in: "Walk-in (manual entry)",
};

/** Website checkout vs studio key-in channel */
export function orderSourceLabel(source?: string | null): string {
  if (!source) return "Website";
  return ORDER_SOURCE_LABEL[source] ?? titleFromSnake(source);
}

/** True when the order was entered by staff (not a website checkout). */
export function isKeyedInOrder(source?: string | null): boolean {
  return Boolean(source && source !== "online");
}

export const ORDER_SOURCE_FILTERS = [
  { key: "online", label: "Website" },
  { key: "whatsapp", label: "WhatsApp (manual entry)" },
  { key: "phone", label: "Phone (manual entry)" },
  { key: "walk_in", label: "Walk-in (manual entry)" },
] as const;

export function stageLabel(stage: ProductionStage | string): string {
  return STAGE_LABEL[stage as ProductionStage] ?? titleFromSnake(stage);
}
