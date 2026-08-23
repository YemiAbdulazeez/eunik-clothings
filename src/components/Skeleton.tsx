import type { ReactNode } from "react";

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-line/70 ${className}`} aria-hidden />;
}

export function PageSkeleton() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-10" role="status" aria-label="Loading">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-72" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="aspect-[3/4] w-full" />
        <Skeleton className="aspect-[3/4] w-full" />
        <Skeleton className="aspect-[3/4] w-full" />
      </div>
    </div>
  );
}

export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-label="Loading">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="aspect-[3/4] w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3" role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-2xl" />
      ))}
    </div>
  );
}

export function HeroSkeleton() {
  return <Skeleton className="h-[50vh] w-full rounded-none" />;
}

export function WithSkeleton({
  loading,
  skeleton,
  children,
}: {
  loading: boolean;
  skeleton?: ReactNode;
  children: ReactNode;
}) {
  if (loading) return <>{skeleton ?? <PageSkeleton />}</>;
  return <>{children}</>;
}
