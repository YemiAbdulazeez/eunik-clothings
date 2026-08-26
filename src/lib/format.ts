export { statusLabel, roleLabel, orderKindLabel, orderSourceLabel, isKeyedInOrder, ORDER_SOURCE_FILTERS, stageLabel } from "./statusLabels";

export function formatWhen(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-NG", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function statusTone(status: string): "muted" | "gold" | "ok" | "warn" | "ink" {
  if (["successful", "ready", "delivered", "confirmed", "completed", "done", "live", "accepted", "paid"].includes(status)) {
    return "ok";
  }
  if (
    [
      "awaiting_verification",
      "awaiting_transfer",
      "pending_payment",
      "requested",
      "low",
      "sent",
      "new",
      "partial",
    ].includes(status)
  ) {
    return "warn";
  }
  if (["rejected", "failed", "cancelled", "out", "declined", "expired"].includes(status)) return "muted";
  if (["production", "sewing", "cutting", "finishing", "first_fitting", "alterations"].includes(status)) return "gold";
  return "ink";
}
