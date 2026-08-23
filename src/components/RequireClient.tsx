import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSession } from "@/context/SessionProvider";
import StaffShopGuard from "@/components/StaffShopGuard";

function Splash() {
  return <div className="eunik-os grid min-h-screen place-items-center text-sm">Opening the house…</div>;
}

/** Public marketing pages that still require a signed-in client. */
export default function RequireClient({ children }: { children: ReactNode }) {
  const { user, loading } = useSession();
  const location = useLocation();

  if (loading) return <Splash />;

  if (!user) {
    const next = `${location.pathname}${location.search}`;
    return <Navigate to={`/account/login?next=${encodeURIComponent(next)}`} replace />;
  }

  return <StaffShopGuard>{children}</StaffShopGuard>;
}
