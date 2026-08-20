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
  if (["successful", "ready", "delivered", "confirmed", "completed", "done", "live"].includes(status)) return "ok";
  if (["awaiting_verification", "awaiting_transfer", "pending_payment", "requested", "low"].includes(status)) return "warn";
  if (["rejected", "failed", "cancelled", "out"].includes(status)) return "muted";
  if (["production", "sewing", "cutting"].includes(status)) return "gold";
  return "ink";
}
