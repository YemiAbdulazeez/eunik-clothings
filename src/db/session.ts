import { SESSION_KEY, type PublicUser, type Role, type Session } from "./types";
import { landingPathForUser } from "../lib/rbac";

export function readSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export function writeSession(session: Session | null): void {
  if (!session) {
    localStorage.removeItem(SESSION_KEY);
    return;
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function landingPath(userOrRole: PublicUser | Role): string {
  if (typeof userOrRole !== "string") return landingPathForUser(userOrRole);
  const role = userOrRole;
  if (role === "client") return "/account";
  if (role === "tailor" || role === "cutter" || role === "qc") return "/atelier";
  if (role === "finance") return "/studio/payments";
  if (role === "content") return "/studio/content";
  if (role === "designer") return "/studio/custom";
  return "/studio";
}

export const ATELIER_ROLES: Role[] = ["tailor", "cutter", "qc"];
export const STAFF_ROLES: Role[] = [
  "super_admin",
  "manager",
  "desk",
  "designer",
  "tailor",
  "cutter",
  "qc",
  "finance",
  "content",
];
