import type { ReactNode } from "react";
import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { useSession } from "@/context/SessionProvider";
import { landingPath } from "@/db/session";

function Splash() {
  return <div className="eunik-os grid min-h-screen place-items-center text-sm">Opening the house…</div>;
}

export default function StaffShopGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useSession();
  const isStaff = Boolean(user && user.role !== "client");

  useEffect(() => {
    if (!loading && isStaff) {
      toast.message("House staff use Studio, not the bag.");
    }
  }, [loading, isStaff]);

  if (loading) return <Splash />;
  if (isStaff && user) {
    return <Navigate to={landingPath(user)} replace />;
  }
  return <>{children}</>;
}
