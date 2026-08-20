import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { EmptyState, Field, OsButton, PageHeader, SectionCard, StatusBadge, inputClass } from "@/components/os/ui";
import { db } from "@/db/database";
import { useAsync } from "@/hooks/useAsync";
import { statusTone } from "@/lib/format";
import { useSession } from "@/context/SessionProvider";

export default function AccountAppointments() {
  const { user } = useSession();
  const { data: rows } = useAsync(() => db.appointments.listMine(), []);
  const [open, setOpen] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    await db.appointments.create({
      customerName: user?.name ?? String(data.get("name") ?? ""),
      service: String(data.get("service") ?? "Consultation"),
      date: String(data.get("date") ?? ""),
      time: String(data.get("time") ?? ""),
      location: "Eunik HQ, Ibadan",
      notes: String(data.get("notes") ?? ""),
    });
    toast.success("Requested. Desk will confirm.");
    event.currentTarget.reset();
    setOpen(false);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Appointments"
        subtitle="Ibadan HQ — measurements, fittings, consultations."
        actions={
          <OsButton onClick={() => setOpen(true)}>Request a slot</OsButton>
        }
      />
      {open ? (
        <SectionCard title="Book Ibadan">
          <form onSubmit={(event) => void submit(event)} className="grid gap-3 md:grid-cols-2">
            <Field label="Service">
              <select name="service" className={inputClass}>
                <option>Consultation</option>
                <option>Measurement</option>
                <option>Fitting</option>
              </select>
            </Field>
            <Field label="Date">
              <input name="date" type="date" required className={inputClass} />
            </Field>
            <Field label="Time">
              <input name="time" type="time" required className={inputClass} />
            </Field>
            <div className="md:col-span-2">
              <Field label="Notes">
                <textarea name="notes" className={inputClass} />
              </Field>
            </div>
            <div className="flex gap-2">
              <OsButton type="submit">Request</OsButton>
              <OsButton variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </OsButton>
            </div>
          </form>
        </SectionCard>
      ) : null}
      {!rows?.length ? (
        <EmptyState title="Nothing booked" text="The desk confirms after you request a time." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {(rows ?? []).map((row) => (
            <SectionCard key={row.id} title={row.service} action={<StatusBadge label={row.status} tone={statusTone(row.status)} />}>
              <p className="text-ink">
                {row.date} · {row.time}
              </p>
              <p className="text-sm">{row.location}</p>
              <p className="mt-2 text-sm">{row.notes}</p>
            </SectionCard>
          ))}
        </div>
      )}
    </div>
  );
}
