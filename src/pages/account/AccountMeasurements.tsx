import { Link } from "react-router-dom";
import { PageHeader, SectionCard, EmptyState, OsButton } from "@/components/os/ui";
import { useSession } from "@/context/SessionProvider";
import { db } from "@/db/database";
import { useAsync } from "@/hooks/useAsync";
import { toast } from "sonner";

export default function AccountMeasurements() {
  const { user } = useSession();
  const { data: profiles } = useAsync(
    () => (user ? db.measurements.listByCustomer(user.id) : Promise.resolve([])),
    [user?.id],
  );
  const { data: appointments } = useAsync(() => db.appointments.listMine(), []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Measurements"
        subtitle="Profiles freeze onto a ticket when we cut. Incomplete rows stay in the book."
        actions={
          <Link to="/account/appointments" className="os-pill bg-gold text-ink">
            Book a measure
          </Link>
        }
      />
      <div className="grid gap-4 md:grid-cols-2">
        {(profiles ?? []).map((profile) => {
          const keys = Object.keys(profile.values);
          const fill = Math.round((keys.length / 9) * 100);
          return (
            <SectionCard key={profile.id} title={profile.name}>
              <p className="text-sm capitalize">
                {profile.fit} · {profile.unit} · {profile.measuredAt.slice(0, 10)}
              </p>
              <div className="mt-3 h-2 rounded-full bg-paper">
                <div className="h-2 rounded-full bg-ink" style={{ width: `${fill}%` }} />
              </div>
              <p className="mt-1 text-xs">{keys.length} of 9 native fields</p>
              <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
                {Object.entries(profile.values).map(([key, value]) => (
                  <div key={key} className="rounded-lg bg-paper px-3 py-2">
                    <span className="os-label">{key}</span>
                    <p className="text-ink">{value} {profile.unit}</p>
                  </div>
                ))}
              </dl>
            </SectionCard>
          );
        })}
      </div>
      {!profiles?.length ? (
        <EmptyState title="No profiles" text="Book Ibadan HQ and we will fill the tape." />
      ) : null}
      <SectionCard title="Related visits">
        {(appointments ?? []).map((item) => (
          <p key={item.id} className="text-sm">
            {item.service} · {item.date} {item.time}
          </p>
        ))}
        <OsButton
          className="mt-4"
          variant="ghost"
          onClick={() => toast.message("Profiles are written on the floor, then frozen onto the order.")}
        >
          How freeze works
        </OsButton>
      </SectionCard>
    </div>
  );
}
