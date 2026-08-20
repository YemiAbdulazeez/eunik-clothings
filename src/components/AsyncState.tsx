import type { ReactNode } from "react";
import { ForbiddenError } from "@/db/database";

export function AsyncGuard({
  loading,
  error,
  children,
  skeleton,
  empty,
}: {
  loading: boolean;
  error: string | null;
  children: ReactNode;
  skeleton?: ReactNode;
  empty?: ReactNode;
}) {
  if (loading) {
    return <>{skeleton ?? <p className="py-10 text-center text-sm text-muted">Loading…</p>}</>;
  }
  if (error) {
    const forbidden = error.includes("permission") || error.includes("cannot");
    return (
      <p className="rounded-2xl border border-line bg-paper px-4 py-8 text-center text-sm text-muted">
        {forbidden ? "Your access cannot open this screen." : error}
      </p>
    );
  }
  if (empty) return <>{empty}</>;
  return <>{children}</>;
}

export function isForbiddenError(error: unknown): boolean {
  return error instanceof ForbiddenError;
}
