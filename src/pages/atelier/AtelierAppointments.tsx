import { toast } from "sonner";
import { OsButton, PageHeader, SectionCard, StatusBadge } from "@/components/os/ui";
import { useSession } from "@/context/SessionProvider";
import { db } from "@/db/database";
import { useAsync } from "@/hooks/useAsync";
import { statusTone } from "@/lib/format";
import { canConfirmAppointments } from "@/lib/rbac";

export default function AtelierAppointments() {
  const { user } = useSession();
  const { data: rows } = useAsync(() => db.appointments.listAll(), []);
  const canConfirm = user ? canConfirmAppointments(user) : false;

  return (
    <div className="space-y-6">
      <PageHeader title="Floor book" subtitle="Confirm walk-ins from the desk if your role allows it." />
      <div className="grid gap-4 md:grid-cols-2">
        {(rows ?? []).map((row) => (
          <SectionCard
            key={row.id}
            title={`${row.customerName} · ${row.service}`}
            action={<StatusBadge label={row.status} tone={statusTone(row.status)} />}
          >
            <p className="text-ink">
              {row.date} · {row.time}
            </p>
            <p className="text-sm">{row.location}</p>
            <p className="mt-2 text-sm">{row.notes}</p>
            {row.status === "requested" && canConfirm ? (
              <OsButton
                className="mt-3"
                onClick={() =>
                  void db.appointments
                    .setStatus(row.id, "confirmed")
                    .then(() => toast.success("Confirmed."))
                    .catch((error) => toast.error(error instanceof Error ? error.message : "Could not confirm."))
                }
              >
                Confirm
              </OsButton>
            ) : null}
          </SectionCard>
        ))}
      </div>
    </div>
  );
}
