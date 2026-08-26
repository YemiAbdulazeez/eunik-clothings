import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
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
import { landingPath } from "@/db/session";
import { canSeeSection, canUseArea, sectionForPath } from "@/lib/rbac";
import type { PublicUser as HouseUser } from "@/db/types";
import { trackPageView } from "@/lib/track";

const accountItems = [
  { to: "/account", label: "Home", icon: LayoutDashboard },
  { to: "/account/shop", label: "Shop", icon: ShoppingBag },
  { to: "/account/orders", label: "Orders", icon: Package },
  { to: "/account/custom", label: "Custom", icon: Sparkles },
  { to: "/account/measurements", label: "Measurements", icon: Ruler },
  { to: "/account/appointments", label: "Bookings", icon: Calendar },
  { to: "/account/payments", label: "Payments", icon: CreditCard },
  { to: "/account/wishlist", label: "Wishlist", icon: Heart },
  { to: "/account/reviews", label: "Reviews", icon: MessageCircleHeart },
  { to: "/account/journal", label: "Magazine", icon: BookOpen },
  { to: "/account/support", label: "Help", icon: Headphones },
  { to: "/account/profile", label: "Profile", icon: User },
];

const studioItems = [
  { to: "/studio", label: "Home", icon: LayoutDashboard },
  { to: "/studio/orders", label: "Orders", icon: ClipboardList },
  { to: "/studio/products", label: "Products", icon: Shirt },
  { to: "/studio/collections", label: "Collections", icon: Layers },
  { to: "/studio/customers", label: "Clients", icon: Users },
  { to: "/studio/custom", label: "Custom requests", icon: Inbox },
  { to: "/studio/quotes", label: "Quotes", icon: FileText },
  { to: "/studio/production", label: "Floor board", icon: Factory },
  { to: "/studio/payments", label: "Payments", icon: CreditCard },
  { to: "/studio/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/studio/support", label: "Support", icon: Headphones },
  { to: "/studio/content", label: "Content", icon: BookOpen },
  { to: "/studio/events", label: "Events", icon: Calendar },
  { to: "/studio/people", label: "Staff", icon: UserCog },
  { to: "/studio/appointments", label: "Bookings", icon: Calendar },
  { to: "/studio/attendance", label: "Attendance", icon: Clock },
  { to: "/studio/profile", label: "Profile", icon: User },
  { to: "/studio/settings", label: "Settings", icon: Settings },
];

const atelierItems = [
  { to: "/atelier", label: "My bench", icon: Shirt },
  { to: "/atelier/queue", label: "Queue", icon: ClipboardList },
  { to: "/atelier/fittings", label: "Fittings", icon: Ruler },
  { to: "/atelier/appointments", label: "Bookings", icon: Calendar },
  { to: "/atelier/attendance", label: "Attendance", icon: Clock },
  { to: "/atelier/profile", label: "Profile", icon: User },
];

function Splash() {
  return <div className="eunik-os grid min-h-screen place-items-center text-sm">Opening…</div>;
}

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

function AccountPageTracker() {
  const { pathname } = useLocation();
  useEffect(() => {
    trackPageView(pathname);
  }, [pathname]);
  return null;
}

export function AccountGate() {
  const { user, loading } = useSession();
  if (loading) return <Splash />;
  if (!user) return <Navigate to="/account/login" replace />;
  if (user.role !== "client") return <Navigate to={landingPath(user)} replace />;
  return (
    <>
      <OsShell
        brand="My account"
        mark={<HouseMark />}
        items={accountItems}
        searchPlaceholder="Search orders, quotes, bookings…"
        profileTo="/account/profile"
      >
        <AccountPageTracker />
        <Outlet />
      </OsShell>
      <DemoRoleSwitcher />
    </>
  );
}

export function StudioGate() {
  const { user, loading } = useSession();
  const location = useLocation();
  if (loading) return <Splash />;
  if (!user) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/studio/login?next=${next}`} replace />;
  }
  if (user.role === "client") return <Navigate to="/account" replace />;
  if (!canUseArea(user, "studio")) return <Navigate to={landingPath(user)} replace />;
  return (
    <>
      <OsShell
        brand="House"
        mark={<HouseMark />}
        items={visibleItems(user, studioItems)}
        searchPlaceholder="Search orders, clients, products…"
        profileTo="/studio/profile"
      >
        <RestrictedOutlet user={user} />
      </OsShell>
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
      <OsShell
        brand="Floor"
        mark={<HouseMark />}
        items={visibleItems(user, atelierItems)}
        searchPlaceholder="Find an order or client…"
        profileTo="/atelier/profile"
      >
        <RestrictedOutlet user={user} />
      </OsShell>
      <DemoRoleSwitcher />
    </>
  );
}
