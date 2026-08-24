import { Link } from "react-router-dom";
import { PageHeader, PageLoading, SectionCard, StatCard, EmptyState } from "@/components/os/ui";
import { db } from "@/db/database";
import type { PublicUser } from "@/db/types";
import { useAsync } from "@/hooks/useAsync";

export default function StudioCustomers() {
  const { data: customers, loading, reload } = useAsync(() => db.people.customers(), []);
  if (loading && !customers) return <PageLoading />;
  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        subtitle="Guest checkouts and registered clients — open a book for notes, orders, and balances."
        onRefresh={() => reload()}
      />
      <StatCard label="Client books" value={String(customers?.length ?? 0)} />
      {!customers?.length ? (
        <EmptyState title="No clients" text="Guest checkout opens a client book automatically." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {(customers ?? []).map((person) => {
            const extra = person as PublicUser & { orderCount?: number; outstandingKobo?: number; createdAt?: string };
            return (
              <Link key={person.id} to={`/studio/customers/${person.id}`}>
                <SectionCard title={person.name}>
                  <p className="text-sm">
                    {person.email} · {person.phone || "No phone"}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {extra.orderCount != null ? `${extra.orderCount} order(s)` : "Client book"}
                    {person.city ? ` · ${person.city}` : ""}
                  </p>
                  {person.notes ? <p className="mt-2 text-sm italic text-ink">{person.notes}</p> : null}
                </SectionCard>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
