import { Navigate, Outlet, useLocation } from "react-router-dom";
import {
  BarChart3,
  BookOpen,
  Calendar,
  ClipboardList,
  Clock,
  CreditCard,
  Factory,
  FileText,
  Headphones,
  Heart,
  Inbox,
  Layers,
  LayoutDashboard,
  MessageCircleHeart,
  Package,
  Ruler,
  Settings,
  Shirt,
  ShoppingBag,
  Sparkles,
  User,
  UserCog,
  Users,
} from "lucide-react";
import { useSession } from "@/context/SessionProvider";
import OsShell, { HouseMark } from "@/components/os/OsShell";
import DemoRoleSwitcher from "@/components/os/DemoRoleSwitcher";
import MustChangePasswordGate from "@/components/MustChangePasswordGate";
import { landingPath } from "@/db/session";
import { canSeeSection, canUseArea, sectionForPath } from "@/lib/rbac";
import type { PublicUser as HouseUser } from "@/db/types";

function Splash() {
  return <div className="eunik-os grid min-h-screen place-items-center text-sm">Opening the house…</div>;
}

const accountItems = [
  { to: "/account", label: "Overview", icon: LayoutDashboard },
  { to: "/account/shop", label: "Shop", icon: ShoppingBag },
  { to: "/account/orders", label: "Orders", icon: Package },
  { to: "/account/custom", label: "Custom", icon: Sparkles },
  { to: "/account/measurements", label: "Tape", icon: Ruler },
  { to: "/account/appointments", label: "Book", icon: Calendar },
  { to: "/account/payments", label: "Payments", icon: CreditCard },
  { to: "/account/wishlist", label: "Wishlist", icon: Heart },
  { to: "/account/reviews", label: "Reviews", icon: MessageCircleHeart },
  { to: "/account/journal", label: "Magazine", icon: BookOpen },
  { to: "/account/support", label: "Support", icon: Headphones },
  { to: "/account/profile", label: "Profile", icon: User },
];

const studioItems = [
  { to: "/studio", label: "Overview", icon: LayoutDashboard },
  { to: "/studio/orders", label: "Orders", icon: ClipboardList },
  { to: "/studio/products", label: "Products", icon: Shirt },
  { to: "/studio/collections", label: "Collections", icon: Layers },
  { to: "/studio/customers", label: "Clients", icon: Users },
  { to: "/studio/custom", label: "Requests", icon: Inbox },
  { to: "/studio/quotes", label: "Quotes", icon: FileText },
  { to: "/studio/production", label: "Production", icon: Factory },
  { to: "/studio/payments", label: "Payments", icon: CreditCard },
  { to: "/studio/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/studio/support", label: "Support", icon: Headphones },
  { to: "/studio/content", label: "Content", icon: BookOpen },
  { to: "/studio/events", label: "Events", icon: Calendar },
  { to: "/studio/people", label: "Staff", icon: UserCog },
  { to: "/studio/appointments", label: "Appointments", icon: Calendar },
  { to: "/studio/attendance", label: "Attendance", icon: Clock },
  { to: "/studio/settings", label: "Settings", icon: Settings },
];

const atelierItems = [
  { to: "/atelier", label: "My bench", icon: Shirt },
  { to: "/atelier/queue", label: "Queue", icon: ClipboardList },
  { to: "/atelier/fittings", label: "Fittings", icon: Ruler },
  { to: "/atelier/appointments", label: "Book", icon: Calendar },
  { to: "/atelier/attendance", label: "Attendance", icon: Clock },
  { to: "/atelier/profile", label: "Profile", icon: User },
];

function visibleItems(user: HouseUser, items: typeof studioItems) {
  return items.filter((item) => canSeeSection(user, sectionForPath(item.to)));
}

function RestrictedOutlet({ user }: { user: HouseUser }) {
  const { pathname } = useLocation();
  const section = sectionForPath(pathname);
  if (!canSeeSection(user, section)) {
    return <Navigate to={landingPath(user)} replace />;
  }
  return <Outlet />;
}

export function AccountGate() {
  const { user, loading } = useSession();
  if (loading) return <Splash />;
  if (!user) return <Navigate to="/account/login" replace />;
  if (user.role !== "client") return <Navigate to={landingPath(user)} replace />;
  return (
    <>
      <MustChangePasswordGate>
        <OsShell
          brand="Client atelier"
          mark={<HouseMark />}
          items={accountItems}
          searchPlaceholder="Search orders, quotations, fittings…"
          profileTo="/account/profile"
        >
          <Outlet />
        </OsShell>
      </MustChangePasswordGate>
      <DemoRoleSwitcher />
    </>
  );
}

export function StudioGate() {
  const { user, loading } = useSession();
  if (loading) return <Splash />;
  if (!user) return <Navigate to="/studio/login" replace />;
  if (user.role === "client") return <Navigate to="/account" replace />;
  if (!canUseArea(user, "studio")) return <Navigate to={landingPath(user)} replace />;
  return (
    <>
      <MustChangePasswordGate>
        <OsShell
          brand="Fashion House OS"
          mark={<HouseMark />}
          items={visibleItems(user, studioItems)}
          searchPlaceholder="Search SKUs, clients, orders…"
          profileTo="/studio/profile"
        >
          <RestrictedOutlet user={user} />
        </OsShell>
      </MustChangePasswordGate>
      <DemoRoleSwitcher />
    </>
  );
}

export function AtelierGate() {
  const { user, loading } = useSession();
  if (loading) return <Splash />;
  if (!user) return <Navigate to="/studio/login" replace />;
  if (user.role === "client") return <Navigate to="/account" replace />;
  if (!canUseArea(user, "atelier")) return <Navigate to={landingPath(user)} replace />;
  return (
    <>
      <MustChangePasswordGate>
        <OsShell
          brand="Atelier floor"
          mark={<HouseMark />}
          items={visibleItems(user, atelierItems)}
          searchPlaceholder="Find a garment or client…"
          profileTo="/atelier/profile"
        >
          <RestrictedOutlet user={user} />
        </OsShell>
      </MustChangePasswordGate>
      <DemoRoleSwitcher />
    </>
  );
}
