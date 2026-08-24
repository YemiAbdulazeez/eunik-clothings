import { type FormEvent, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Field, OsButton, PageHeader, ProgressBar, SectionCard, StatusBadge, inputClass } from "@/components/os/ui";
import { db } from "@/db/database";
import { useAsync } from "@/hooks/useAsync";
import { formatNaira } from "@/lib/money";
import { statusLabel, statusTone } from "@/lib/format";

export default function StudioCustomer() {
  const { id = "" } = useParams();
  const { data: person, reload } = useAsync(() => db.people.get(id), [id]);
  const { data: orders } = useAsync(
    () => db.orders.listAll().then((rows) => rows.filter((row) => row.customerId === id)),
    [id],
  );
  const { data: profiles } = useAsync(() => db.measurements.listByCustomer(id).catch(() => []), [id]);
  const outstanding = (orders ?? []).reduce((sum, item) => sum + Math.max(0, item.totalKobo - item.paidKobo), 0);
  const [busy, setBusy] = useState(false);

  async function saveNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const notes = String(new FormData(event.currentTarget).get("notes") ?? "");
    setBusy(true);
    try {
      await db.people.updateUser(id, { notes });
      toast.success("Dossier updated.");
      await reload();
    } finally {
      setBusy(false);
    }
  }

  if (!person) return <p>Loading client…</p>;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Customer dossier"
        title={person.name}
        subtitle={`${person.email} · ${person.phone} · ${person.city}`}
      />
      <SectionCard title="Client details">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="os-label">Gender</dt>
            <dd className="capitalize text-ink">{person.gender ?? "—"}</dd>
          </div>
          <div>
            <dt className="os-label">Address</dt>
            <dd className="text-ink">{person.address ?? "—"}</dd>
          </div>
          <div>
            <dt className="os-label">Birthday</dt>
            <dd className="text-ink">
              {person.birthDay && person.birthMonth ? `${person.birthDay} / ${person.birthMonth}` : "—"}
            </dd>
          </div>
          <div>
            <dt className="os-label">Preferred fit</dt>
            <dd className="capitalize text-ink">{person.preferredFit ?? "—"}</dd>
          </div>
        </dl>
      </SectionCard>
      <div className="grid gap-4 sm:grid-cols-3">
        <SectionCard title="Outstanding">
          <p className="font-alt text-2xl text-ink">{formatNaira(outstanding)}</p>
        </SectionCard>
        <SectionCard title="Tickets">
          <p className="font-alt text-2xl text-ink">{orders?.length ?? 0}</p>
        </SectionCard>
        <SectionCard title="Profiles">
          <p className="font-alt text-2xl text-ink">{profiles?.length ?? 0}</p>
        </SectionCard>
      </div>
      <SectionCard title="CRM note">
        <form onSubmit={(event) => void saveNote(event)} className="space-y-3">
          <Field label="Internal note">
            <textarea name="notes" defaultValue={person.notes} rows={4} className={inputClass} />
          </Field>
          <OsButton type="submit" loading={busy} loadingText="Saving…">
            Save note
          </OsButton>
        </form>
      </SectionCard>
      <SectionCard title="Orders">
        <ul className="space-y-3">
          {(orders ?? []).map((order) => (
            <li key={order.id} className="rounded-xl border border-line p-4">
              <div className="flex items-center justify-between">
                <p className="text-ink">
                  <Link to={`/studio/orders/${order.id}`} className="underline">
                    #{order.number}
                  </Link>{" "}
                  {order.name}
                </p>
                <StatusBadge label={statusLabel(order.status)} tone={statusTone(order.status)} />
              </div>
              <p className="text-sm">
                {formatNaira(order.paidKobo)} / {formatNaira(order.totalKobo)}
              </p>
              <ProgressBar value={order.totalKobo ? (order.paidKobo / order.totalKobo) * 100 : 0} gold />
            </li>
          ))}
        </ul>
      </SectionCard>
    </div>
  );
}
