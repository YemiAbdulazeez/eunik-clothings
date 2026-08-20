import type { NavSection, PublicUser, Role } from "@/db/types";

export type { NavSection };

export type NavArea = "studio" | "atelier";

export type NavCatalogItem = {
  id: NavSection;
  label: string;
  hint: string;
  path: string;
  area: NavArea;
};

export const NAV_CATALOG: NavCatalogItem[] = [
  { id: "overview", label: "Home", hint: "House home", path: "/studio", area: "studio" },
  { id: "orders", label: "Orders", hint: "Client orders", path: "/studio/orders", area: "studio" },
  { id: "products", label: "Products", hint: "Add and edit looks", path: "/studio/products", area: "studio" },
  { id: "collections", label: "Collections", hint: "Shop rails", path: "/studio/collections", area: "studio" },
  { id: "customers", label: "Clients", hint: "Client books", path: "/studio/customers", area: "studio" },
  { id: "custom", label: "Custom requests", hint: "Custom inbox", path: "/studio/custom", area: "studio" },
  { id: "quotes", label: "Quotes", hint: "Send and revise quotes", path: "/studio/quotes", area: "studio" },
  { id: "production", label: "Floor board", hint: "Orders on the floor", path: "/studio/production", area: "studio" },
  { id: "payments", label: "Payments", hint: "Paystack and bank transfers", path: "/studio/payments", area: "studio" },
  { id: "analytics", label: "Analytics", hint: "Sales and traffic", path: "/studio/analytics", area: "studio" },
  { id: "support", label: "Support", hint: "Client messages", path: "/studio/support", area: "studio" },
  { id: "content", label: "Content", hint: "Magazine and homepage", path: "/studio/content", area: "studio" },
  { id: "events", label: "Events", hint: "Shows and fittings", path: "/studio/events", area: "studio" },
  { id: "people", label: "Staff", hint: "Hire and what they can open", path: "/studio/people", area: "studio" },
  { id: "attendance", label: "Attendance", hint: "Clock in and out", path: "/studio/attendance", area: "studio" },
  { id: "appointments", label: "Bookings", hint: "Ibadan appointments", path: "/studio/appointments", area: "studio" },
  { id: "settings", label: "Settings", hint: "House settings", path: "/studio/settings", area: "studio" },
  { id: "bench", label: "My bench", hint: "Orders on your bench", path: "/atelier", area: "atelier" },
  { id: "queue", label: "Queue", hint: "Floor queue", path: "/atelier/queue", area: "atelier" },
  { id: "fittings", label: "Fittings", hint: "Fitting notes", path: "/atelier/fittings", area: "atelier" },
  { id: "profile", label: "Profile", hint: "Your file", path: "/studio/profile", area: "studio" },
];

const ALL_STUDIO: NavSection[] = NAV_CATALOG.filter((item) => item.area === "studio").map((item) => item.id);
const ALL_ATELIER: NavSection[] = ["bench", "queue", "fittings", "appointments", "attendance", "profile"];
const STUDIO_CORE: NavSection[] = [
  "overview",
  "orders",
  "products",
  "collections",
  "customers",
  "custom",
  "quotes",
  "production",
  "payments",
  "analytics",
  "support",
  "content",
  "events",
  "people",
  "settings",
];
const FLOOR_CORE: NavSection[] = ["bench", "queue", "fittings"];

export const DEFAULT_NAV: Record<Role, NavSection[]> = {
  client: [],
  super_admin: ALL_STUDIO,
  manager: ALL_STUDIO.filter((id) => id !== "people"),
  desk: ["overview", "orders", "customers", "custom", "quotes", "appointments", "support", "attendance", "profile"],
  designer: ["overview", "custom", "quotes", "production", "content", "events", "profile"],
  finance: ["overview", "orders", "payments", "analytics", "customers", "profile"],
  content: ["overview", "products", "collections", "content", "events", "profile"],
  tailor: ALL_ATELIER,
  cutter: ALL_ATELIER,
  qc: ALL_ATELIER,
};

export function isHouseStaff(user: { role: Role } | null | undefined): boolean {
  return Boolean(user && user.role !== "client");
}

export function canShop(user: { role: Role } | null | undefined): boolean {
  return !user || user.role === "client";
}

export function isFloorRole(role: Role): boolean {
  return role === "tailor" || role === "cutter" || role === "qc";
}

export function defaultNav(role: Role): NavSection[] {
  return [...DEFAULT_NAV[role]];
}

export function assignedNav(user: PublicUser): NavSection[] {
  if (user.role === "client") return [];
  if (user.role === "super_admin") return ALL_STUDIO;
  const listed = user.navSections?.length ? user.navSections : defaultNav(user.role);
  return listed.includes("profile") ? listed : [...listed, "profile"];
}

export function canConfirmAppointments(user: PublicUser): boolean {
  return user.role === "super_admin" || user.role === "manager" || user.role === "desk";
}

export function canDeleteProducts(user: PublicUser): boolean {
  return user.role === "super_admin" || user.role === "manager";
}

export function canSeeSection(user: PublicUser, section: NavSection): boolean {
  if (user.role === "client") return false;
  if (user.role === "super_admin") return true;
  if (section === "profile") return true;
  return assignedNav(user).includes(section);
}

export function canUseArea(user: PublicUser, area: NavArea): boolean {
  if (user.role === "super_admin") return true;
  const nav = assignedNav(user);
  if (area === "atelier") {
    return nav.some((id) => FLOOR_CORE.includes(id));
  }
  return nav.some((id) => STUDIO_CORE.includes(id)) || (!isFloorRole(user.role) && nav.includes("appointments"));
}

export function studioPathForSection(id: NavSection): string {
  if (id === "profile") return "/studio/profile";
  if (id === "attendance") return "/studio/attendance";
  if (id === "appointments") return "/studio/appointments";
  if (id === "bench") return "/atelier";
  return NAV_CATALOG.find((item) => item.id === id)?.path ?? "/studio";
}

export function atelierPathForSection(id: NavSection): string {
  if (id === "profile") return "/atelier/profile";
  if (id === "attendance") return "/atelier/attendance";
  if (id === "appointments") return "/atelier/appointments";
  if (id === "overview") return "/atelier";
  return NAV_CATALOG.find((item) => item.id === id)?.path ?? "/atelier";
}

export function landingPathForUser(user: PublicUser): string {
  if (user.role === "client") return "/account";
  const roleLanding: Partial<Record<Role, NavSection>> = {
    finance: "payments",
    content: "content",
    designer: "custom",
    desk: "overview",
  };
  const preferred = roleLanding[user.role];
  if (preferred && canSeeSection(user, preferred)) {
    if (FLOOR_CORE.includes(preferred)) return atelierPathForSection(preferred);
    return studioPathForSection(preferred);
  }
  const nav = assignedNav(user);
  const firstNav = nav.find((id) => id !== "profile");
  if (!firstNav) return isFloorRole(user.role) ? "/atelier" : "/studio";
  if (FLOOR_CORE.includes(firstNav) || (isFloorRole(user.role) && !STUDIO_CORE.includes(firstNav))) {
    return atelierPathForSection(firstNav);
  }
  return studioPathForSection(firstNav);
}

export function postLoginPath(user: PublicUser, next?: string | null): string {
  if (user.role !== "client") return landingPathForUser(user);
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/account";
  if (next.startsWith("/studio") || next.startsWith("/atelier")) return "/account";
  return next;
}

export function sectionForPath(pathname: string): NavSection {
  if (pathname.startsWith("/atelier/profile") || pathname.startsWith("/studio/profile")) return "profile";
  if (pathname.startsWith("/atelier/attendance") || pathname.startsWith("/studio/attendance")) return "attendance";
  if (pathname.startsWith("/atelier/appointments") || pathname.startsWith("/studio/appointments")) return "appointments";
  if (pathname === "/atelier" || pathname === "/atelier/") return "bench";
  const ranked = [...NAV_CATALOG].sort((a, b) => b.path.length - a.path.length);
  const hit = ranked.find((item) => pathname === item.path || pathname.startsWith(`${item.path}/`));
  return hit?.id ?? "overview";
}

export const HIRE_ROLES: Role[] = [
  "manager",
  "desk",
  "designer",
  "tailor",
  "cutter",
  "qc",
  "finance",
  "content",
];
