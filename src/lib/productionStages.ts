import type { ProductionStage, Role } from "@/db/types";

export const ALL_STAGES: ProductionStage[] = [
  "quote_accepted",
  "deposit_paid",
  "design_confirmed",
  "fabric_confirmed",
  "measurements_confirmed",
  "cutting",
  "sewing",
  "finishing",
  "first_fitting",
  "alterations",
  "final_fitting",
  "quality_check",
  "ready",
  "completed",
];

export const WAITING_STAGES: ProductionStage[] = [
  "quote_accepted",
  "deposit_paid",
  "design_confirmed",
  "fabric_confirmed",
  "measurements_confirmed",
];

export const FLOOR_COLUMNS: ProductionStage[] = ["cutting", "sewing", "finishing", "quality_check", "ready"];

export const KANBAN_COLUMNS: ProductionStage[] = [...WAITING_STAGES, ...FLOOR_COLUMNS];

export function isWaitingStage(stage: ProductionStage): boolean {
  return WAITING_STAGES.includes(stage);
}

export function nextStage(stage: ProductionStage): ProductionStage {
  const index = ALL_STAGES.indexOf(stage);
  return ALL_STAGES[Math.min(index + 1, ALL_STAGES.length - 1)];
}

const ROLE_ADVANCE: Partial<Record<Role, ProductionStage[]>> = {
  cutter: ["cutting", "sewing"],
  tailor: ["sewing", "finishing", "first_fitting", "alterations", "final_fitting"],
  qc: ["quality_check", "finishing", "ready", "completed"],
};

export function nextLegalStage(stage: ProductionStage, role: Role): ProductionStage | null {
  const next = nextStage(stage);
  if (role === "super_admin" || role === "manager" || role === "designer" || role === "desk") return next;
  const allowed = ROLE_ADVANCE[role];
  if (!allowed) return null;
  if (allowed.includes(next) || allowed.includes(stage)) return next;
  return null;
}

export function canAdvanceStage(stage: ProductionStage, role: Role): boolean {
  return nextLegalStage(stage, role) !== null;
}
