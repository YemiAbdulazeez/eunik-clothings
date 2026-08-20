import { Link } from "react-router-dom";
import { PageHeader, SectionCard, StatCard, EmptyState } from "@/components/os/ui";
import { db } from "@/db/database";
import { useAsync } from "@/hooks/useAsync";

export default function StudioCustomers() {
  const { data: customers } = useAsync(() => db.people.customers(), []);
  return (
    <div className="space-y-6">
      <PageHeader title="Customers" subtitle="Open a dossier for CRM notes, tickets and balances." />
      <StatCard label="Client books" value={String(customers?.length ?? 0)} />
      {!customers?.length ? (
        <EmptyState title="No clients" text="Checkout will open a book automatically." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {(customers ?? []).map((person) => (
            <Link key={person.id} to={`/studio/customers/${person.id}`}>
              <SectionCard title={person.name}>
                <p className="text-sm">
                  {person.email} · {person.phone}
                </p>
                {person.notes ? <p className="mt-2 text-sm italic text-ink">{person.notes}</p> : null}
              </SectionCard>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
