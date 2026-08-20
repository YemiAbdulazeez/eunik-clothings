import type { NavSection, PublicUser, Role } from "@/db/types";
import { canUseArea, landingPathForUser } from "@/lib/rbac";

export function navAreaLabel(user: Pick<PublicUser, "role" | "navSections">): string {
  const studio = canUseArea(user as PublicUser, "studio");
  const atelier = canUseArea(user as PublicUser, "atelier");
  if (studio && atelier) return "House + Floor";
  if (studio) return "House";
  if (atelier) return "Floor";
  return "None — pick at least one door";
}

export function validateStaffNav(role: Role, navSections: NavSection[]): { ok: boolean; message?: string } {
  const preview: PublicUser = {
    id: "preview",
    email: "preview@eunik.demo",
    role,
    name: "Preview",
    firstName: "Preview",
    phone: "",
    city: "Ibadan",
    navSections,
  };
  if (!canUseArea(preview, "studio") && !canUseArea(preview, "atelier")) {
    return { ok: false, message: "Pick at least one studio or floor door — empty access loops on login." };
  }
  return { ok: true };
}

export function previewLandingPath(role: Role, navSections: NavSection[]): string {
  return landingPathForUser({
    id: "preview",
    email: "preview@eunik.demo",
    role,
    name: "Preview",
    firstName: "Preview",
    phone: "",
    city: "Ibadan",
    navSections,
  });
}
